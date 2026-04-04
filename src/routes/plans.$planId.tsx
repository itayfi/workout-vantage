import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkoutPlans, type WorkoutPlan, type ExerciseVariant } from '@/stores/workout-plans-storage';
import { Plus, Trash2, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const variantSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name too short"),
  machineType: z.string(),
  weightStep: z.number().min(0),
});

const slotSchema = z.object({
  id: z.string(),
  targetMuscle: z.string().min(2, "Muscle required"),
  alternatives: z.array(variantSchema),
  targetSets: z.number().min(1),
  targetReps: z.number().min(1),
  targetWeight: z.number().min(0).optional(),
});

const planSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Plan name required"),
  slots: z.array(slotSchema),
});

type PlanFormValues = z.infer<typeof planSchema>;

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plans/$planId',
  component: PlanEditor,
});

function PlanEditor() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const { plans, addPlan, updatePlan, _hasHydrated } = useWorkoutPlans();
  const [isReady, setIsReady] = useState(false);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      id: '',
      name: 'New Plan',
      slots: [],
    },
  });

  const { fields: slots, append: appendSlot, remove: removeSlot } = useFieldArray({
    control: form.control,
    name: "slots",
  });

  // Initialize once hydrated
  useEffect(() => {
    if (_hasHydrated && !isReady) {
      const existingPlan = plans.find((p) => p.id === planId);
      if (existingPlan) {
        form.reset(existingPlan);
      } else if (planId === 'new') {
        form.reset({
          id: Math.random().toString(36).substring(2, 11),
          name: 'New Plan',
          slots: [],
        });
      }
      setIsReady(true);
    }
  }, [_hasHydrated, plans, planId, form, isReady]);

  const onSubmit = (data: PlanFormValues) => {
    // eslint-disable-next-line
    const timestamp = Date.now();
    const fullPlan: WorkoutPlan = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (planId === 'new' || !plans.find((p) => p.id === planId)) {
      addPlan(fullPlan);
    } else {
      updatePlan(planId, fullPlan);
    }
    navigate({ to: '/plans' });
  };

  if (!isReady) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <span className="text-xs font-black uppercase tracking-widest opacity-20">Loading Plan</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex animate-in flex-col gap-6 pb-40 duration-500 slide-in-from-right-5 fade-in overflow-x-hidden">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: '/plans' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    className="h-auto border-none bg-transparent text-2xl font-black focus-visible:ring-0 px-1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4">
          {slots.map((item, index) => (
            <MuscleSlotItem 
              key={item.id} 
              index={index} 
              control={form.control} 
              onRemove={() => removeSlot(index)} 
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="flex h-20 flex-col gap-1 border-2 border-dashed bg-muted/10 hover:bg-muted/20 transition-colors"
            onClick={() => appendSlot({
              id: Math.random().toString(36).substring(2, 11),
              targetMuscle: 'Muscle Group',
              alternatives: [],
              targetSets: 3,
              targetReps: 12,
            })}
          >
            <Plus className="h-5 w-5 text-primary" />
            <span className="font-bold">Add Muscle Group Slot</span>
          </Button>
        </div>

        <div className="fixed bottom-20 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
          <div className="mx-auto max-w-lg">
            <Button
              type="submit"
              className="h-14 w-full text-lg font-black shadow-2xl shadow-primary/40"
            >
              <Save className="mr-2 h-5 w-5" />
              Save Plan
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

function MuscleSlotItem({ index, control, onRemove }: { index: number, control: Control<PlanFormValues>, onRemove: () => void }) {
  const { fields, append: appendMachine, remove: removeMachine } = useFieldArray({
    control,
    name: `slots.${index}.alternatives` as const,
  });

  const machines = fields as unknown as (ExerciseVariant & { id: string })[];

  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [newMachine, setNewMachine] = useState<Partial<ExerciseVariant>>({
    name: '',
    machineType: 'Machine',
    weightStep: 2.5,
  });

  return (
    <Card className="group relative overflow-hidden border-2 border-primary/10 pt-0">
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
            {index + 1}
          </div>
          <FormField
            control={control}
            name={`slots.${index}.targetMuscle`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-8 max-w-[200px] border-none bg-transparent font-bold focus-visible:ring-0 px-2"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`slots.${index}.targetSets`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Sets</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`slots.${index}.targetReps`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Target Reps</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`slots.${index}.targetWeight`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1 col-span-2">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Target Weight (kg - Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.5"
                    placeholder="e.g. 20"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
            Machines / Exercises
          </label>
          {machines.map((alt, altIndex) => (
            <div
              key={alt.id}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 group/machine"
            >
              <div className="flex-1 text-sm font-medium">
                {alt.name} <span className="ml-2 text-[10px] opacity-70">({alt.weightStep}kg)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover/machine:opacity-30 hover:opacity-100! transition-opacity"
                onClick={() => removeMachine(altIndex)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          <Dialog open={isAddingMachine} onOpenChange={setIsAddingMachine}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="w-full border-dashed">
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
                <Button type="button" onClick={() => {
                  if (newMachine.name) {
                    appendMachine({
                      id: Math.random().toString(36).substring(2, 11),
                      name: newMachine.name,
                      machineType: newMachine.machineType || 'Machine',
                      weightStep: newMachine.weightStep || 2.5,
                    });
                    setNewMachine({ name: '', machineType: 'Machine', weightStep: 2.5 });
                    setIsAddingMachine(false);
                  }
                }}>Add to Slot</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
