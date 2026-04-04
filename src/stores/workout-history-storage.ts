import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type SetRecord = {
  reps: number;
  weight: number;
  timestamp: number;
};

export type SessionExerciseRecord = {
  exerciseId: string; // references ExerciseVariant id
  exerciseName: string;
  sets: SetRecord[];
  suggestedWeightForNextTime: number; // calculated after session
};

export type WorkoutSession = {
  id: string;
  planId: string;
  planName: string;
  startTime: number;
  endTime: number | null;
  exercises: SessionExerciseRecord[];
};

interface WorkoutHistoryState {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;

  startSession: (planId: string, planName: string) => void;
  endSession: () => void;
  updateActiveExercise: (exerciseRecord: SessionExerciseRecord) => void;
  getSuggestedWeight: (exerciseId: string) => number;
}

// Config localforage for zustand
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await localforage.getItem(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

export const useHistoryStore = create<WorkoutHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,

      startSession: (planId, planName) => {
        set({
          activeSession: {
            id: Date.now().toString(),
            planId,
            planName,
            startTime: Date.now(),
            endTime: null,
            exercises: [],
          },
        });
      },

      endSession: () => {
        const { activeSession, sessions } = get();
        if (activeSession) {
          const completedSession = { ...activeSession, endTime: Date.now() };
          set({
            sessions: [...sessions, completedSession],
            activeSession: null,
          });
        }
      },

      updateActiveExercise: (exerciseRecord) => {
        const { activeSession } = get();
        if (activeSession) {
          // Check if exercise already exists in active session
          const existingIndex = activeSession.exercises.findIndex((e) => e.exerciseId === exerciseRecord.exerciseId);

          const newExercises = [...activeSession.exercises];
          if (existingIndex >= 0) {
            newExercises[existingIndex] = exerciseRecord;
          } else {
            newExercises.push(exerciseRecord);
          }

          set({
            activeSession: {
              ...activeSession,
              exercises: newExercises,
            },
          });
        }
      },

      getSuggestedWeight: (exerciseId: string) => {
        const { sessions } = get();
        // Find the most recent session with this exercise
        for (let i = sessions.length - 1; i >= 0; i--) {
          const session = sessions[i];
          const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
          if (exercise && exercise.suggestedWeightForNextTime > 0) {
            return exercise.suggestedWeightForNextTime;
          }
        }
        return 0; // Default if never done before
      },
    }),
    {
      name: 'workout-history-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);
