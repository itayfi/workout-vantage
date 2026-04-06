import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type SessionStatus = 'SELECTING' | 'EXERCISE' | 'RESTING' | 'CHOOSING_NEXT' | 'SUMMARY';

export interface PerformanceLog {
  reps: number;
  weight: number;
  machineId: string;
  machineName: string;
  muscleName: string;
  timestamp: number;
}

export interface ActiveSessionState {
  status: SessionStatus;
  activePlanId: string | null;
  currentExerciseId: string | null;
  currentSetIndex: number;
  selectedMachineId: string | null;
  // exerciseId -> PerformanceLog[]
  logs: Record<string, PerformanceLog[]>;
  sessionTargetSets: Record<string, number>;
  startTime: number | null;
  _hasHydrated: boolean;

  // Actions
  startSession: (
    planId: string,
    initialExerciseId: string | null,
    initialExerciseSets: { exerciseId: string; sets: number }[],
  ) => void;
  updateStatus: (status: SessionStatus) => void;
  updateSet: (exerciseId: string, setIndex: number) => void;
  updateMachine: (machineId: string) => void;
  logSet: (exerciseId: string, setIndex: number, log: Omit<PerformanceLog, 'timestamp'>) => void;
  addExtraSet: (exerciseId: string) => void;
  capSessionSets: (exerciseId: string, newCount: number) => void;
  resetSession: () => void;
}

export const useActiveSession = create<ActiveSessionState>()(
  persist(
    (set, get) => ({
      status: 'SELECTING',
      activePlanId: null,
      currentExerciseId: null,
      currentSetIndex: 0,
      selectedMachineId: null,
      logs: {},
      sessionTargetSets: {},
      startTime: null,
      _hasHydrated: false,

      startSession: (planId, initialExerciseId, initialExerciseSets) => {
        const targetSets: Record<string, number> = {};
        initialExerciseSets.forEach((s) => {
          targetSets[s.exerciseId] = s.sets;
        });

        set({
          activePlanId: planId,
          status: 'EXERCISE',
          currentExerciseId: initialExerciseId,
          currentSetIndex: 0,
          selectedMachineId: null,
          logs: {},
          sessionTargetSets: targetSets,
          startTime: Date.now(),
        });
      },

      updateStatus: (status) => set({ status }),

      updateSet: (exerciseId, setIndex) => set({ currentExerciseId: exerciseId, currentSetIndex: setIndex }),

      updateMachine: (machineId) => {
        const state = get();
        if (!state.currentExerciseId) return;
        const exerciseLogs = state.logs[state.currentExerciseId] || [];

        set({
          selectedMachineId: machineId,
          currentSetIndex: exerciseLogs.length,
        });
      },

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

      capSessionSets: (exerciseId, newCount) =>
        set((state) => ({
          sessionTargetSets: {
            ...state.sessionTargetSets,
            [exerciseId]: newCount,
          },
        })),

      resetSession: () =>
        set({
          status: 'SELECTING',
          activePlanId: null,
          currentExerciseId: null,
          currentSetIndex: 0,
          selectedMachineId: null,
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
