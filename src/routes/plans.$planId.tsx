import { useState, useEffect, useCallback, useRef } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkoutPlans, type WorkoutPlan } from '@/stores/workout-plans-storage';
import { Plus, Trash2, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { MUSCLE_CATALOG, MUSCLE_GROUPS, getMuscleIdsFromPath } from '@/lib/muscles';
import { EXERCISE_PRESETS, type ExercisePreset } from '@/lib/exercises';
import { Search, Dumbbell, ChevronRight, Sparkles, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name required'),
  machineType: z.string().min(1, 'Type required'),
  musclePath: z.string().min(2, 'Muscle required'),
  primaryMuscles: z.array(z.string()).min(1, 'Choose at least one primary muscle'),
  secondaryMuscles: z.array(z.string()),
  weightStep: z.number().min(0),
  targetSets: z.number().min(1),
  targetReps: z.number().min(1),
  restSeconds: z.number().min(0),
  targetWeight: z.number().min(0).optional(),
  videoLink: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
});

const planSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Plan name required'),
  exercises: z.array(exerciseSchema),
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
      exercises: [],
    },
  });

  const {
    fields: exercises,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control: form.control,
    name: 'exercises',
  });

  const initializedRef = useRef(false);

  // Initialize once hydrated
  useEffect(() => {
    if (_hasHydrated && !initializedRef.current) {
      const existingPlan = plans.find((p) => p.id === planId);
      if (existingPlan) {
        form.reset({
          ...existingPlan,
          exercises: existingPlan.exercises.map((exercise) => ({
            ...exercise,
            restSeconds: exercise.restSeconds ?? 60,
            primaryMuscles: exercise.primaryMuscles?.length
              ? exercise.primaryMuscles
              : getMuscleIdsFromPath(exercise.musclePath),
            secondaryMuscles: exercise.secondaryMuscles ?? [],
            videoLink: exercise.videoLink ?? '',
          })),
        });
      } else if (planId === 'new') {
        form.reset({
          id: Math.random().toString(36).substring(2, 11),
          name: 'New Plan',
          exercises: [],
        });
      }
      initializedRef.current = true;
      // Use setTimeout to avoid synchronous setState inside useEffect warning
      setTimeout(() => setIsReady(true), 0);
    }
  }, [_hasHydrated, plans, planId, form]);

  const onSubmit = useCallback(
    (data: PlanFormValues) => {
      const existingPlan = plans.find((p) => p.id === planId);
      const now = Date.now();
      const fullPlan: WorkoutPlan = {
        ...data,
        createdAt: existingPlan?.createdAt || now,
        updatedAt: now,
      };

      if (planId === 'new' || !existingPlan) {
        addPlan(fullPlan);
      } else {
        updatePlan(planId, fullPlan);
      }
      navigate({ to: '/plans' });
    },
    [planId, plans, addPlan, updatePlan, navigate],
  );

  if (!isReady) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <span className="text-xs font-black tracking-widest uppercase opacity-20">Loading Plan</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex animate-in flex-col gap-6 overflow-x-hidden pb-40 duration-500 slide-in-from-right-5 fade-in md:pb-20"
      >
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
                    className="h-auto border-none bg-transparent text-3xl font-black focus-visible:ring-0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4">
          {exercises.map((item, index) => (
            <ExerciseItem key={item.id} index={index} control={form.control} onRemove={() => removeExercise(index)} />
          ))}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="flex h-20 flex-col gap-1 border-2 border-dashed bg-muted/10 transition-colors hover:bg-muted/20"
              onClick={() =>
                appendExercise({
                  id: Math.random().toString(36).substring(2, 11),
                  name: 'New Exercise',
                  machineType: 'Machine',
                  musclePath: 'Legs/Quads',
                  primaryMuscles: ['quads'],
                  secondaryMuscles: [],
                  weightStep: 2.5,
                  targetSets: 3,
                  targetReps: 12,
                  restSeconds: 60,
                  videoLink: '',
                })
              }
            >
              <Plus className="h-5 w-5 text-primary" />
              <span className="font-bold">Manual Add</span>
            </Button>

            <ExercisePresetPicker
              onSelect={(preset) =>
                appendExercise({
                  id: Math.random().toString(36).substring(2, 11),
                  ...preset,
                  videoLink: preset.videoLink ?? '',
                })
              }
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="flex h-20 flex-col gap-1 border-2 border-dashed border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-bold text-primary">Add from Preset</span>
                </Button>
              }
            />
          </div>
        </div>

        <div className="fixed right-0 bottom-20 left-0 z-50 border-t border-border/50 bg-background/80 p-4 backdrop-blur-md md:bottom-0">
          <div className="mx-auto max-w-lg">
            <Button type="submit" className="h-14 w-full text-lg font-black shadow-2xl shadow-primary/40">
              <Save className="mr-2 h-5 w-5" />
              Save Plan
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

function ExerciseItem({
  index,
  control,
  onRemove,
}: {
  index: number;
  control: Control<PlanFormValues>;
  onRemove: () => void;
}) {
  return (
    <Card className="group relative overflow-hidden border-2 border-primary/10 pt-0">
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
            {index + 1}
          </div>
          <FormField
            control={control}
            name={`exercises.${index}.name`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Input
                    className="h-8 max-w-[200px] border-none bg-transparent px-2 font-black focus-visible:ring-0"
                    placeholder="Exercise Name"
                    {...field}
                  />
                </FormControl>
                <ExercisePresetPicker
                  // I'll need to refactor ExerciseItem to take 'form' instead of 'control' or just use the setValue from useFormContext
                  useFormContextHook={true}
                  index={index}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-primary hover:bg-primary/10"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
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
        <FormField
          control={control}
          name={`exercises.${index}.videoLink`}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                Video Link
              </FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`exercises.${index}.musclePath`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Muscle Path
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Legs/Quads" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${index}.machineType`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Tool Type
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
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
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${index}.weightStep`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Weight Step (kg)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MusclePicker control={control} index={index} name="primaryMuscles" label="Primary Muscles" />
          <MusclePicker control={control} index={index} name="secondaryMuscles" label="Secondary Muscles" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField
            control={control}
            name={`exercises.${index}.targetSets`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Sets
                </FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${index}.targetReps`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Reps
                </FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${index}.targetWeight`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Weight (opt)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="20"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${index}.restSeconds`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Rest (sec)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MusclePicker({
  control,
  index,
  name,
  label,
}: {
  control: Control<PlanFormValues>;
  index: number;
  name: 'primaryMuscles' | 'secondaryMuscles';
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={`exercises.${index}.${name}`}
      render={({ field }) => {
        const selected = field.value ?? [];

        return (
          <FormItem className="flex flex-col gap-2">
            <FormLabel className="text-[10px] font-black text-muted-foreground uppercase opacity-60">{label}</FormLabel>
            <FormControl>
              <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-3">
                {MUSCLE_GROUPS.map((group) => (
                  <div key={group} className="space-y-1.5">
                    <span className="block text-[9px] font-black tracking-widest text-primary uppercase opacity-70">
                      {group}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MUSCLE_CATALOG.filter((muscle) => muscle.group === group).map((muscle) => {
                        const isSelected = selected.includes(muscle.id);
                        return (
                          <Button
                            key={muscle.id}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 rounded-md px-2 text-[10px] font-black uppercase"
                            onClick={() => {
                              field.onChange(
                                isSelected
                                  ? selected.filter((id: string) => id !== muscle.id)
                                  : [...selected, muscle.id],
                              );
                            }}
                          >
                            {muscle.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function ExercisePresetPicker({
  onSelect,
  trigger,
  useFormContextHook = false,
  index,
}: {
  onSelect?: (preset: ExercisePreset) => void;
  trigger?: React.ReactNode;
  useFormContextHook?: boolean;
  index?: number;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { setValue } = useFormContext() || {};

  const filteredPresets = EXERCISE_PRESETS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (preset: ExercisePreset) => {
    if (useFormContextHook && index !== undefined && setValue) {
      setValue(`exercises.${index}.name`, preset.name);
      setValue(`exercises.${index}.machineType`, preset.machineType);
      setValue(`exercises.${index}.musclePath`, preset.musclePath);
      setValue(`exercises.${index}.primaryMuscles`, preset.primaryMuscles);
      setValue(`exercises.${index}.secondaryMuscles`, preset.secondaryMuscles);
      setValue(`exercises.${index}.weightStep`, preset.weightStep);
      setValue(`exercises.${index}.targetSets`, preset.targetSets);
      setValue(`exercises.${index}.targetReps`, preset.targetReps);
      setValue(`exercises.${index}.restSeconds`, preset.restSeconds);
      setValue(`exercises.${index}.videoLink`, preset.videoLink ?? '');
    } else if (onSelect) {
      onSelect(preset);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline">Presets</Button>}</DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col gap-0 overflow-hidden border-2 border-primary/20 bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="border-b border-border/50 p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl font-black tracking-tight uppercase italic">
            <Dumbbell className="h-6 w-6 text-primary" />
            Exercise Presets
          </DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              className="h-12 pl-10 text-lg font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredPresets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Dumbbell className="mb-4 h-12 w-12" />
              <p className="text-xs font-black tracking-widest uppercase">No exercises found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 p-2">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelect(preset)}
                  className="group flex items-center justify-between rounded-2xl border-2 border-transparent bg-muted/30 p-4 transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm transition-transform group-hover:scale-110">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg leading-tight font-black">{preset.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="text-[10px] font-black text-primary/70 uppercase">{preset.machineType}</span>
                        <span className="text-[10px] font-black text-muted-foreground/70 uppercase">
                          {preset.musclePath}
                        </span>
                        {preset.videoLink && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-red-500/70 uppercase">
                            <Video className="h-3 w-3" /> Video
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/50 bg-muted/20 p-4 text-center">
          <p className="text-[10px] font-black tracking-widest uppercase opacity-40">
            Powered by Workout Vantage Presets
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
