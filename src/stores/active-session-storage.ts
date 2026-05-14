import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type SessionStatus = 'SELECTING' | 'EXERCISE' | 'RESTING' | 'CHOOSING_NEXT' | 'SUMMARY';

export interface PerformanceLog {
  reps: number;
  weight: number;
  suggestedWeight: number;
  machineId: string;
  machineName: string;
  muscleName: string;
  timestamp: number;
}

export interface ActiveSessionState {
  status: SessionStatus;
  activePlanId: string | null;
  currentExerciseIds: string[]; // 1 for single, 2 for superset
  activeExerciseIndex: number; // 0 or 1, tracks which of currentExerciseIds is active
  currentSetIndex: number;
  // exerciseId -> PerformanceLog[]
  logs: Record<string, PerformanceLog[]>;
  sessionTargetSets: Record<string, number>;
  startTime: number | null;
  _hasHydrated: boolean;

  // Actions
  startSession: (
    planId: string,
    initialExerciseIds: string[],
    initialExerciseSets: { exerciseId: string; sets: number }[],
  ) => void;
  updateStatus: (status: SessionStatus) => void;
  updateSet: (exerciseIds: string[], setIndex: number) => void;
  setActiveExerciseIndex: (index: number) => void;
  logSet: (exerciseId: string, setIndex: number, log: Omit<PerformanceLog, 'timestamp'>) => void;
  addExtraSet: (exerciseId: string) => void;
  resetSession: () => void;
}

export const useActiveSession = create<ActiveSessionState>()(
  persist(
    (set) => ({
      status: 'SELECTING',
      activePlanId: null,
      currentExerciseIds: [],
      activeExerciseIndex: 0,
      currentSetIndex: 0,
      logs: {},
      sessionTargetSets: {},
      startTime: null,
      _hasHydrated: false,

      startSession: (planId, initialExerciseIds, initialExerciseSets) => {
        const targetSets: Record<string, number> = {};
        initialExerciseSets.forEach((s) => {
          targetSets[s.exerciseId] = s.sets;
        });

        set({
          activePlanId: planId,
          status: 'EXERCISE',
          currentExerciseIds: initialExerciseIds,
          activeExerciseIndex: 0,
          currentSetIndex: 0,
          logs: {},
          sessionTargetSets: targetSets,
          startTime: Date.now(),
        });
      },

      updateStatus: (status) => set({ status }),

      updateSet: (exerciseIds, setIndex) =>
        set({
          currentExerciseIds: exerciseIds,
          currentSetIndex: setIndex,
          activeExerciseIndex: 0,
        }),

      setActiveExerciseIndex: (index) => set({ activeExerciseIndex: index }),

      logSet: (exerciseId, setIndex, log) =>
        set((state) => {
          const exerciseLogs = [...(state.logs[exerciseId] || [])];
          exerciseLogs[setIndex] = { ...log, timestamp: Date.now() };

          return {
            logs: { ...state.logs, [exerciseId]: exerciseLogs },
          };
        }),

      addExtraSet: (exerciseId) =>
        set((state) => ({
          sessionTargetSets: {
            ...state.sessionTargetSets,
            [exerciseId]: (state.sessionTargetSets[exerciseId] || 0) + 1,
          },
        })),

      resetSession: () =>
        set({
          status: 'SELECTING',
          activePlanId: null,
          currentExerciseIds: [],
          activeExerciseIndex: 0,
          currentSetIndex: 0,
          logs: {},
          sessionTargetSets: {},
          startTime: null,
        }),
    }),
    {
      name: 'active-session-storage',
      storage: createJSONStorage(() => localforage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    },
  ),
);
