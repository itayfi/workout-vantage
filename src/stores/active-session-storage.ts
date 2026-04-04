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
  currentSlotIndex: number;
  currentSetIndex: number;
  selectedMachineId: string | null;
  logs: Record<number, PerformanceLog[]>;
  sessionTargetSets: Record<number, number>;
  startTime: number | null;
  _hasHydrated: boolean;

  // Actions
  startSession: (planId: string, initialMachineId: string | null, initialSlotSets: { slotIndex: number, sets: number }[]) => void;
  updateStatus: (status: SessionStatus) => void;
  updateSet: (slotIndex: number, setIndex: number) => void;
  updateMachine: (machineId: string | null) => void;
  logSet: (slotIndex: number, setIndex: number, log: Omit<PerformanceLog, 'timestamp'>) => void;
  addExtraSet: (slotIndex: number) => void;
  capSessionSets: (slotIndex: number, newCount: number) => void;
  resetSession: () => void;
}

export const useActiveSession = create<ActiveSessionState>()(
  persist(
    (set) => ({
      status: 'SELECTING',
      activePlanId: null,
      currentSlotIndex: 0,
      currentSetIndex: 0,
      selectedMachineId: null,
      logs: {},
      sessionTargetSets: {},
      startTime: null,
      _hasHydrated: false,

      startSession: (planId, initialMachineId, initialSlotSets) => {
        const targetSets: Record<number, number> = {};
        initialSlotSets.forEach(s => { targetSets[s.slotIndex] = s.sets; });
        
        set({
          activePlanId: planId,
          status: 'EXERCISE',
          currentSlotIndex: 0,
          currentSetIndex: 0,
          selectedMachineId: initialMachineId,
          logs: {},
          sessionTargetSets: targetSets,
          startTime: Date.now(),
        });
      },

      updateStatus: (status) => set({ status }),

      updateSet: (slotIndex, setIndex) => 
        set({ currentSlotIndex: slotIndex, currentSetIndex: setIndex }),

      updateMachine: (machineId) => set({ selectedMachineId: machineId }),

      logSet: (slotIndex, setIndex, log) => 
        set((state) => {
          const slotLogs = [...(state.logs[slotIndex] || [])];
          slotLogs[setIndex] = { ...log, timestamp: Date.now() };
          return {
            logs: { ...state.logs, [slotIndex]: slotLogs }
          };
        }),

      addExtraSet: (slotIndex) => 
        set((state) => ({ 
          sessionTargetSets: { 
            ...state.sessionTargetSets, 
            [slotIndex]: (state.sessionTargetSets[slotIndex] || 0) + 1 
          } 
        })),

      capSessionSets: (slotIndex, newCount) =>
        set((state) => ({
          sessionTargetSets: {
            ...state.sessionTargetSets,
            [slotIndex]: newCount
          }
        })),

      resetSession: () => set({
        status: 'SELECTING',
        activePlanId: null,
        currentSlotIndex: 0,
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
    }
  )
);
