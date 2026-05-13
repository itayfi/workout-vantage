import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type PlannedExercise = {
  id: string;
  name: string;
  machineType: string; // e.g. "Machine", "Dumbbell"
  musclePath: string; // e.g. "Legs/Quads"
  weightStep: number; // e.g. 2.5 or 5
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  targetWeight?: number;
  videoLink?: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  exercises: PlannedExercise[];
  createdAt: number;
  updatedAt: number;
};

interface WorkoutPlansState {
  plans: WorkoutPlan[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addPlan: (plan: WorkoutPlan) => void;
  updatePlan: (id: string, updatedPlan: Partial<WorkoutPlan>) => void;
  deletePlan: (id: string) => void;
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

export const useWorkoutPlans = create<WorkoutPlansState>()(
  persist(
    (set) => ({
      plans: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
      updatePlan: (id, updatedPlan) =>
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? { ...p, ...updatedPlan, updatedAt: Date.now() } : p)),
        })),
      deletePlan: (id) =>
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'workout-plans-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
