import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export interface PerformanceLog {
  reps: number;
  weight: number;
  timestamp: number;
}

export interface CompletedWorkout {
  id: string;
  planId: string;
  planName: string;
  startTime: number;
  endTime: number;
  logs: Record<number, PerformanceLog[]>;
  sessionTargetSets: Record<number, number>;
  totalSets: number;
  totalExercises: number;
}

interface WorkoutHistoryState {
  history: CompletedWorkout[];
  _hasHydrated: boolean;
  addWorkout: (workout: Omit<CompletedWorkout, 'id'>) => void;
  clearHistory: () => void;
}

export const useWorkoutHistory = create<WorkoutHistoryState>()(
  persist(
    (set) => ({
      history: [],
      _hasHydrated: false,
      addWorkout: (workout) => set((state) => ({
        history: [
          { ...workout, id: Math.random().toString(36).substring(2, 9) },
          ...state.history
        ].slice(0, 100) // Keep last 100 workouts
      })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'workout-history-storage',
      storage: createJSONStorage(() => localforage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);
