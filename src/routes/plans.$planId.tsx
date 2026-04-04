import { useState, useCallback } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  useWorkoutPlans,
  type WorkoutPlan,
  type MuscleGroupSlot,
  type ExerciseVariant,
} from '@/stores/workout-plans-storage';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plans/$planId',
  component: PlanEditor,
});

function PlanEditor() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const { plans, addPlan, updatePlan } = useWorkoutPlans();

  // Find the plan or initialize a new one
  const [localPlan, setLocalPlan] = useState<WorkoutPlan>(() => {
    const existingPlan = plans.find((p) => p.id === planId);
    if (existingPlan) return existingPlan;

    return {
      id: planId === 'new' ? Math.random().toString(36).substring(2, 11) : planId,
      name: 'New Plan',
      slots: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [currentSlotId, setCurrentSlotId] = useState<string | null>(null);
  const [newMachine, setNewMachine] = useState<Partial<ExerciseVariant>>({
    name: '',
    machineType: 'Machine',
    weightStep: 2.5,
  });

  const savePlan = () => {
    if (planId === 'new' || !plans.find((p) => p.id === planId)) {
      addPlan(localPlan);
    } else {
      updatePlan(planId, localPlan);
    }
    navigate({ to: '/plans' });
  };

  const addSlot = () => {
    setLocalPlan({
      ...localPlan,
      slots: [
        ...localPlan.slots,
        {
          id: Math.random().toString(36).substring(2, 11),
          targetMuscle: 'Muscle Group',
          alternatives: [],
          targetSets: 3,
          targetReps: 12,
        },
      ],
    });
  };

  const removeSlot = (slotId: string) => {
    setLocalPlan({
      ...localPlan,
      slots: localPlan.slots.filter((s) => s.id !== slotId),
    });
  };

  const updateSlot = useCallback((slotId: string, updates: Partial<MuscleGroupSlot>) => {
    setLocalPlan((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const handleAddMachine = () => {
    if (!currentSlotId || !newMachine.name) return;

    const variant: ExerciseVariant = {
      id: Math.random().toString(36).substring(2, 11),
      name: newMachine.name,
      machineType: (newMachine.machineType as any) || 'Machine',
      weightStep: newMachine.weightStep || 2.5,
    };

    setLocalPlan((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.id === currentSlotId ? { ...s, alternatives: [...s.alternatives, variant] } : s)),
    }));

    setIsAddingMachine(false);
    setNewMachine({ name: '', machineType: 'Machine', weightStep: 2.5 });
  };

  const removeMachine = (slotId: string, machineId: string) => {
    setLocalPlan((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === slotId ? { ...s, alternatives: s.alternatives.filter((a) => a.id !== machineId) } : s,
      ),
    }));
  };

  return (
    <div className="flex animate-in flex-col gap-6 pb-32 duration-500 slide-in-from-right-5 fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/plans' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Input
          className="h-auto border-none bg-transparent text-2xl font-black focus-visible:ring-0"
          value={localPlan.name}
          onChange={(e) => setLocalPlan({ ...localPlan, name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-4">
        {localPlan.slots.map((slot, index) => (
          <Card key={slot.id} className="group relative overflow-hidden border-2 border-primary/10 pt-0">
            <CardHeader className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
                  {index + 1}
                </div>
                <Input
                  className="h-8 max-w-[200px] border-none bg-transparent font-bold focus-visible:ring-0"
                  value={slot.targetMuscle}
                  onChange={(e) => updateSlot(slot.id, { targetMuscle: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => removeSlot(slot.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Sets</label>
                  <Input
                    type="number"
                    value={slot.targetSets}
                    onChange={(e) => updateSlot(slot.id, { targetSets: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                    Target Reps
                  </label>
                  <Input
                    type="number"
                    value={slot.targetReps}
                    onChange={(e) => updateSlot(slot.id, { targetReps: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Machines / Exercises
                </label>
                {slot.alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2"
                  >
                    <div className="flex-1 text-sm font-medium">
                      {alt.name} <span className="ml-2 text-[10px] opacity-70">({alt.weightStep}kg)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-30 hover:opacity-100"
                      onClick={() => removeMachine(slot.id, alt.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <Dialog
                  open={isAddingMachine && currentSlotId === slot.id}
                  onOpenChange={(open) => {
                    setIsAddingMachine(open);
                    if (open) setCurrentSlotId(slot.id);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full border-dashed">
                      <Plus className="mr-2 h-3 w-3" />
                      Add Machine
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Exercise/Machine</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          placeholder="e.g. Bench Press"
                          value={newMachine.name}
                          onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Type</label>
                          <Select
                            value={newMachine.machineType}
                            onValueChange={(val) => setNewMachine({ ...newMachine, machineType: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Barbell">Barbell</SelectItem>
                              <SelectItem value="Dumbbell">Dumbbell</SelectItem>
                              <SelectItem value="Machine">Machine</SelectItem>
                              <SelectItem value="Cable">Cable</SelectItem>
                              <SelectItem value="Bodyweight">Bodyweight</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Weight Step (kg)</label>
                          <Input
                            type="number"
                            step="0.5"
                            value={newMachine.weightStep}
                            onChange={(e) => setNewMachine({ ...newMachine, weightStep: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddMachine}>Add to Slot</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          className="flex h-20 flex-col gap-1 border-2 border-dashed bg-muted/10"
          onClick={addSlot}
        >
          <Plus className="h-5 w-5 text-primary" />
          <span className="font-bold">Add Muscle Group Slot</span>
        </Button>
      </div>

      <div className="fixed right-0 bottom-20 left-0 z-50 p-4 md:static md:p-0">
        <Button
          className="h-14 w-full text-lg font-black shadow-2xl shadow-primary/40 md:w-auto md:px-12"
          onClick={savePlan}
        >
          <Save className="mr-2 h-5 w-5" />
          Save Plan
        </Button>
      </div>
    </div>
  );
}
