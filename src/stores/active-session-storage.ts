import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type SessionStatus = 'SELECTING' | 'EXERCISE' | 'RESTING' | 'SUMMARY';

export interface PerformanceLog {
  reps: number;
  weight: number;
}

interface ActiveSessionState {
  status: SessionStatus;
  activePlanId: string | null;
  currentSlotIndex: number;
  currentSetIndex: number;
  selectedMachineId: string | null;
  logs: Record<number, PerformanceLog[]>;
  sessionTargetSets: Record<number, number>; // Dynamic set counts per slot
  startTime: number | null;
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  startSession: (planId: string, machineId: string | null, planSlots: { slotIndex: number, sets: number }[]) => void;
  updateStatus: (status: SessionStatus) => void;
  updateSet: (slotIndex: number, setIndex: number) => void;
  updateMachine: (machineId: string | null) => void;
  logSet: (slotIndex: number, setIndex: number, log: PerformanceLog) => void;
  addExtraSet: (slotIndex: number) => void;
  resetSession: () => void;
}

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

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      startSession: (planId, machineId, planSlots) => {
        const initialTargets = planSlots.reduce((acc, current) => {
          acc[current.slotIndex] = current.sets;
          return acc;
        }, {} as Record<number, number>);
        
        set({ 
          status: 'EXERCISE', 
          activePlanId: planId, 
          currentSlotIndex: 0, 
          currentSetIndex: 0, 
          selectedMachineId: machineId,
          logs: {},
          sessionTargetSets: initialTargets,
          startTime: Date.now() 
        });
      },

      updateStatus: (status) => set({ status }),
      
      updateSet: (slotIndex, setIndex) => set({ 
        currentSlotIndex: slotIndex, 
        currentSetIndex: setIndex 
      }),

      updateMachine: (machineId) => set({ selectedMachineId: machineId }),

      logSet: (slotIndex, setIndex, log) => set((state) => {
        const newLogs = { ...state.logs };
        if (!newLogs[slotIndex]) newLogs[slotIndex] = [];
        newLogs[slotIndex][setIndex] = log;
        return { logs: newLogs };
      }),

      addExtraSet: (slotIndex) => set((state) => {
        const newTargets = { ...state.sessionTargetSets };
        newTargets[slotIndex] = (newTargets[slotIndex] || 0) + 1;
        return { sessionTargetSets: newTargets };
      }),

      resetSession: () => set({ 
        status: 'SELECTING', 
        activePlanId: null, 
        currentSlotIndex: 0, 
        currentSetIndex: 0, 
        selectedMachineId: null,
        logs: {},
        sessionTargetSets: {},
        startTime: null 
      }),
    }),
    {
      name: 'active-session-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
