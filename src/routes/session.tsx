import * as React from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import {
  useWorkoutPlans,
  type PlannedExercise,
} from '@/stores/workout-plans-storage';
import { useActiveSession } from '@/stores/active-session-storage';
import { useWorkoutHistory } from '@/stores/workout-history-storage';
import {
  PlusCircle,
  Check,
  Power,
  Minus,
  Plus,
  Loader2,
  Trophy,
  MoreHorizontal,
  Play,
  RotateCcw,
  SkipForward,
  Activity,
  ChevronDown,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, Label } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session',
  component: Session,
});

const chartConfig = {
  time: {
    label: 'Seconds',
    color: 'var(--accent-amber)',
  },
} satisfies ChartConfig;

function Session() {
  const { plans, _hasHydrated: plansHydrated } = useWorkoutPlans();
  const {
    status,
    activePlanId,
    currentExerciseIds,
    activeExerciseIndex,
    logs,
    sessionTargetSets,
    startTime,
    _hasHydrated: sessionHydrated,
    startSession,
    updateStatus,
    updateSet,
    setActiveExerciseIndex,
    logSet,
    addExtraSet,
    resetSession,
  } = useActiveSession();
  const { addWorkout } = useWorkoutHistory();

  const [actualReps, setActualReps] = React.useState(12);
  const [actualWeight, setActualWeight] = React.useState(20);
  const [timer, setTimer] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [isSelectionDrawerOpen, setIsSelectionDrawerOpen] = React.useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = React.useState(false);
  const [selectedForSuperset, setSelectedForSuperset] = React.useState<string[]>([]);

  const activePlan = plans.find((p) => p.id === activePlanId);
  
  const currentExId = currentExerciseIds[activeExerciseIndex];
  const currentExercise = activePlan?.exercises.find((e) => e.id === currentExId);

  // Grouping logic for the selection UI (now just by top level muscle for better browsing)
  const groupedExercises = React.useMemo(() => {
    if (!activePlan) return {};
    const groups: Record<string, typeof activePlan.exercises> = {};
    activePlan.exercises.forEach((ex) => {
      const topLevel = ex.musclePath.split('/')[0].toUpperCase();
      if (!groups[topLevel]) groups[topLevel] = [];
      groups[topLevel].push(ex);
    });
    return groups;
  }, [activePlan]);

  const getExerciseDoneCount = React.useCallback((exId: string) => {
    return (logs[exId] || []).length;
  }, [logs]);

  const getExerciseTargetSets = React.useCallback((exId: string) => {
    const planEx = activePlan?.exercises.find((e) => e.id === exId);
    return sessionTargetSets[exId] || planEx?.targetSets || 0;
  }, [activePlan, sessionTargetSets]);

  const isExerciseDone = React.useCallback(
    (exId: string) => {
      const done = getExerciseDoneCount(exId);
      const target = getExerciseTargetSets(exId);
      return done >= target && target > 0;
    },
    [getExerciseDoneCount, getExerciseTargetSets],
  );

  const finalizeWorkout = React.useCallback(() => {
    if (!activePlan) return;

    const totalSets = Object.values(logs).flat().length;
    const totalExercises = Object.keys(logs).length;

    addWorkout({
      planId: activePlan.id,
      planName: activePlan.name,
      startTime: startTime || Date.now(),
      endTime: Date.now(),
      logs,
      sessionTargetSets,
      totalSets,
      totalExercises,
    });

    updateStatus('SUMMARY');
  }, [activePlan, logs, sessionTargetSets, startTime, addWorkout, updateStatus]);

  const selectExercises = React.useCallback(
    (exIds: string[]) => {
      const progress = exIds.map(id => getExerciseDoneCount(id));
      const minProgress = Math.min(...progress);
      
      updateSet(exIds, minProgress);
      updateStatus('EXERCISE');
      setIsSelectionDrawerOpen(false);
      setSelectedForSuperset([]);
    },
    [getExerciseDoneCount, updateSet, updateStatus],
  );

  const handleNextStep = React.useCallback(() => {
    const allDone = currentExerciseIds.every(id => isExerciseDone(id));
    
    if (allDone) {
      updateStatus('CHOOSING_NEXT');
    } else {
      const progress = currentExerciseIds.map(id => getExerciseDoneCount(id));
      const minProgress = Math.min(...progress);
      updateSet(currentExerciseIds, minProgress);
      updateStatus('EXERCISE');
    }
    
    setIsTimerRunning(false);
    setTimer(0);
  }, [currentExerciseIds, isExerciseDone, getExerciseDoneCount, updateSet, updateStatus]);

  React.useEffect(() => {
    if (status === 'EXERCISE' && currentExercise) {
      setActualReps(currentExercise.targetReps);
      setActualWeight(currentExercise.targetWeight ?? 20);
    }
  }, [currentExId, currentExercise, status]);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleNextStep();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer, handleNextStep]);

  if (!plansHydrated || !sessionHydrated) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <span className="text-xs font-black tracking-widest uppercase opacity-20">Initializing Session</span>
      </div>
    );
  }

  const handleStartSession = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const initialExerciseSets = plan.exercises.map((s) => ({ exerciseId: s.id, sets: s.targetSets }));
      startSession(planId, [plan.exercises[0].id], initialExerciseSets);
    }
  };

  const handleCompleteSet = () => {
    if (!currentExercise || !currentExId) return;
    
    logSet(currentExId, getExerciseDoneCount(currentExId), {
      reps: actualReps,
      weight: actualWeight,
      machineId: currentExId,
      machineName: currentExercise.name,
      muscleName: currentExercise.musclePath,
    });

    const isSuperset = currentExerciseIds.length > 1;
    const isLastInCycle = activeExerciseIndex === currentExerciseIds.length - 1;

    if (isSuperset && !isLastInCycle) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
    } else {
      setTimer(60);
      setIsTimerRunning(true);
      updateStatus('RESTING');
    }
  };

  const skipToNextExercise = () => {
    updateStatus('CHOOSING_NEXT');
    setIsTimerRunning(false);
    setTimer(0);
  };

  if (status === 'SELECTING') {
    return (
      <div className="flex animate-in flex-col gap-6 duration-500 slide-in-from-bottom-5 fade-in">
        <h1 className="font-heading text-3xl font-bold tracking-tighter italic">START SESSION</h1>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="group cursor-pointer overflow-hidden border-none bg-muted/30 transition-all hover:bg-primary active:scale-95"
              onClick={() => handleStartSession(plan.id)}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold group-hover:text-primary-foreground">{plan.name}</span>
                  <span className="text-xs font-black tracking-widest uppercase opacity-50 group-hover:text-primary-foreground/70">
                    {plan.exercises.length} Exercises
                  </span>
                </div>
                <Play className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </CardContent>
            </Card>
          ))}
          <Link to="/plans/$planId" params={{ planId: 'new' }} className="w-full">
            <Button variant="outline" className="h-16 w-full border-2 border-dashed opacity-60">
              Create New Plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'SUMMARY') {
    return (
      <div className="flex animate-in flex-col gap-8 py-12 pb-32 text-center duration-500 zoom-in-95 fade-in">
        <div className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center rounded-full border-2 border-accent-gold bg-accent-gold/20 text-accent-gold shadow-[0_0_30px_rgba(251,191,36,0.2)]">
          <Trophy className="h-12 w-12" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter italic">WORKOUT COMPLETE</h1>
          <p className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60">
            Session logged to history
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none bg-muted/30">
            <CardContent className="p-6 text-left">
              <span className="text-[10px] font-black uppercase opacity-40">Exercises</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black italic">{Object.keys(logs).length}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-30">Total</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-muted/30">
            <CardContent className="p-6 text-left">
              <span className="text-[10px] font-black text-accent-amber uppercase opacity-40">Total Volume</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-accent-amber italic">
                  {Object.values(logs).flat().length}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-accent-amber uppercase opacity-30">
                  Sets
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="group flex w-full items-center justify-between bg-muted/20 py-6">
              <span className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                <Activity className="h-3 w-3" />
                Detailed Breakdown
              </span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-300', isBreakdownOpen && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-in space-y-4 pt-4 duration-300 slide-in-from-top-2">
            {Object.entries(logs).map(([exId, exerciseLogs]) => {
              const planEx = activePlan?.exercises.find((e) => e.id === exId);
              const muscleName = planEx?.musclePath || exerciseLogs[0]?.muscleName || "Exercise";

              return (
                <Card key={exId} className="overflow-hidden border-none bg-muted/10 text-left">
                  <div className="flex items-center justify-between border-b border-border/10 bg-muted/20 px-4 py-2">
                    <span className="text-[10px] font-black tracking-wider text-primary uppercase">{muscleName}</span>
                    <span className="text-[9px] font-bold uppercase opacity-40">
                      {exerciseLogs.length} sets completed
                    </span>
                  </div>
                  <CardContent className="space-y-4 p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {exerciseLogs.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex flex-col items-center rounded-lg border border-border/10 bg-background/40 p-2"
                        >
                          <span className="mb-1 text-[8px] font-black uppercase opacity-20">{s.machineName.toUpperCase()}</span>
                          <div className="flex items-center gap-1 leading-none font-black">
                            <span className="text-lg italic">{s.reps}</span>
                            <span className="text-[8px] tracking-tighter opacity-40">×</span>
                            <span className="text-lg text-accent-amber italic">{s.weight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Button
          size="lg"
          className="h-16 w-full text-xl font-black italic shadow-2xl shadow-primary/20"
          onClick={resetSession}
        >
          HOME
        </Button>
      </div>
    );
  }

  if (status === 'CHOOSING_NEXT') {
    return (
      <div className="flex animate-in flex-col gap-8 pb-32 duration-500 fade-in slide-in-from-right-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black tracking-widest text-primary uppercase">{activePlan?.name}</span>
          <h1 className="text-4xl font-black italic">CHOOSE NEXT</h1>
        </div>

        <div className="flex flex-col gap-8">
            {Object.entries(groupedExercises).map(([group, exercises]) => {
                return (
                    <div key={group} className="flex flex-col gap-3">
                        <span className="px-1 text-[10px] font-black tracking-[0.2em] text-primary uppercase">{group}</span>
                        <div className="grid gap-3">
                            {exercises.map(ex => {
                                const done = isExerciseDone(ex.id);
                                const isSelected = selectedForSuperset.includes(ex.id);
                                return (
                                    <div key={ex.id} className="flex flex-col gap-2">
                                        <Card
                                            className={cn(
                                                "cursor-pointer border-2 transition-all",
                                                isSelected ? "border-primary bg-primary/10" : "border-transparent bg-muted/40",
                                                done && !isSelected && "opacity-60"
                                            )}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedForSuperset(s => s.filter(id => id !== ex.id));
                                                } else if (selectedForSuperset.length < 2) {
                                                    setSelectedForSuperset(s => [...s, ex.id]);
                                                }
                                            }}
                                        >
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "flex h-10 w-10 items-center justify-center rounded-lg shadow-sm",
                                                        done ? "bg-primary text-primary-foreground" : "bg-background text-primary"
                                                    )}>
                                                        {done ? <Check className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black tracking-tight uppercase italic">{ex.name}</span>
                                                        <span className="text-[10px] font-bold uppercase opacity-60">
                                                            {getExerciseDoneCount(ex.id)} / {getExerciseTargetSets(ex.id)} sets • {ex.machineType}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addExtraSet(ex.id);
                                                        }}
                                                    >
                                                        +1 Set
                                                    </Button>
                                                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

          <div className="fixed right-0 bottom-24 left-0 z-50 p-4 backdrop-blur-md">
            <div className="mx-auto flex max-w-lg gap-3">
                <Button
                    size="lg"
                    className="h-16 flex-1 text-xl font-black italic shadow-2xl"
                    disabled={selectedForSuperset.length === 0}
                    onClick={() => selectExercises(selectedForSuperset)}
                >
                    {selectedForSuperset.length === 2 ? "START SUPERSET" : "START EXERCISE"}
                </Button>
                {selectedForSuperset.length === 0 && (
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-16 px-6 font-black text-muted-foreground italic"
                        onClick={finalizeWorkout}
                    >
                        FINISH
                    </Button>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = [{ time: timer, fill: 'var(--color-time)' }];

  const renderExerciseSelectionGroup = (ex: PlannedExercise) => {
    const isSelected = currentExerciseIds.includes(ex.id);
    return (
        <Card
            key={ex.id}
            className={cn(
                'relative cursor-pointer overflow-hidden border-2 shadow-none transition-all active:scale-[0.98]',
                isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-transparent bg-muted/30',
            )}
            onClick={() => {
                selectExercises([ex.id]);
            }}
        >
            <CardContent className="relative z-10 flex items-center justify-between p-4">
                <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight italic">{ex.name}</span>
                    <span className="text-[10px] font-bold tracking-tighter uppercase opacity-60">
                        {ex.machineType} • {ex.musclePath}
                    </span>
                </div>
                <ChevronRight
                    className={cn(
                        'h-4 w-4',
                        isSelected ? 'text-primary-foreground' : 'text-primary',
                    )}
                />
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="flex animate-in flex-col gap-6 pb-40 duration-500 slide-in-from-right-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-primary uppercase opacity-80">
              {activePlan?.name}
            </span>
            {currentExerciseIds.length > 1 && (
                <>
                    <span className="h-1 w-1 rounded-full bg-primary/30" />
                    <span className="text-[10px] font-black text-accent-amber uppercase">SUPERSET</span>
                </>
            )}
            <span className="h-1 w-1 rounded-full bg-primary/30" />
            <span className="text-[10px] font-black uppercase opacity-40">{status}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight italic">
            {currentExercise?.name || "Exercise"}
          </h1>
          <span className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">
            {currentExercise?.musclePath}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 opacity-40 hover:opacity-100">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border/50 bg-card">
            <DropdownMenuItem onClick={skipToNextExercise} className="cursor-pointer font-bold">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Exercise
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus('SELECTING')} className="cursor-pointer font-medium">
              <RotateCcw className="mr-2 h-4 w-4" />
              Change Plan
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={resetSession} className="cursor-pointer font-bold">
              <Power className="mr-2 h-4 w-4" />
              Quit Workout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {status === 'EXERCISE' ? (
        <div className="flex animate-in flex-col gap-6 duration-500 slide-in-from-right-8">
            {currentExerciseIds.length > 1 && (
                <div className="flex gap-2 p-1">
                    {currentExerciseIds.map((id, idx) => {
                        const ex = activePlan?.exercises.find(e => e.id === id);
                        const active = activeExerciseIndex === idx;
                        return (
                            <div 
                                key={id} 
                                className={cn(
                                    "flex-1 rounded-lg px-3 py-2 border-2 transition-all cursor-pointer",
                                    active ? "border-primary bg-primary/10" : "border-muted-foreground/10 bg-muted/20 opacity-40"
                                )}
                                onClick={() => setActiveExerciseIndex(idx)}
                            >
                                <span className={cn("text-[8px] font-black uppercase tracking-tighter block mb-0.5", active ? "text-primary" : "text-muted-foreground")}>
                                    Part {idx + 1}
                                </span>
                                <span className="text-[10px] font-black truncate block uppercase">{ex?.name}</span>
                            </div>
                        )
                    })}
                </div>
            )}

          <Card className="overflow-hidden border border-none border-border/30 bg-muted/40 shadow-none">
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-2xl leading-none font-black italic">{currentExercise?.name}</span>
                    <span className="mt-1 text-[10px] font-bold tracking-widest uppercase opacity-40">
                    {currentExercise?.machineType} • {currentExercise?.weightStep}kg step
                    </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 bg-background/50 text-[10px] font-black tracking-widest uppercase"
                  onClick={() => setIsSelectionDrawerOpen(true)}
                >
                  Switch
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 rounded-2xl border border-border/50 bg-muted/60 p-4">
                  <span className="text-[10px] font-black uppercase opacity-40">Set Progress</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black italic">{getExerciseDoneCount(currentExId) + 1}</span>
                    <span className="text-xl font-bold opacity-20">/ {getExerciseTargetSets(currentExId)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl border border-accent-gold/10 bg-muted/60 p-4">
                  <span className="text-[10px] font-black uppercase opacity-40">Target Stats</span>
                  <div className="flex flex-col leading-tight">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-accent-amber italic">{currentExercise?.targetReps}</span>
                      <span className="text-[8px] font-bold text-accent-amber uppercase opacity-60">Reps</span>
                    </div>
                    {currentExercise?.targetWeight !== undefined && (
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-accent-gold italic">{currentExercise.targetWeight}</span>
                        <span className="text-[8px] font-bold text-accent-gold uppercase opacity-60">kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-1 gap-2">
                  {Array.from({ length: Math.max(getExerciseTargetSets(currentExId), getExerciseDoneCount(currentExId) + 1) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all duration-300',
                        i < getExerciseDoneCount(currentExId)
                          ? 'bg-primary'
                          : i === getExerciseDoneCount(currentExId)
                            ? 'animate-pulse bg-accent-amber shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                            : 'bg-muted',
                      )}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted"
                  onClick={() => addExtraSet(currentExId)}
                >
                  <PlusCircle className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="group relative h-24 w-full overflow-hidden text-2xl font-black italic shadow-2xl shadow-primary/20"
            onClick={handleCompleteSet}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Check className="h-8 w-8 stroke-3" />
              {currentExerciseIds.length > 1 && activeExerciseIndex === 0 ? "DONE - NEXT PART" : "DONE - START REST"}
            </span>
            <div className="absolute inset-x-0 bottom-0 h-0 bg-white/10 transition-all duration-200 group-active:h-full" />
          </Button>
        </div>
      ) : (
        <div className="flex animate-in flex-col gap-6 duration-500 slide-in-from-right-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-4">
                <div className="flex h-6 items-center rounded-full border border-accent-amber/20 bg-accent-amber/10 px-2">
                  <span className="text-[10px] font-black tracking-widest text-accent-amber uppercase">
                    SET {getExerciseDoneCount(currentExId)} COMPLETE
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-accent-amber/30 uppercase ml-2">
                    RESTING
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: getExerciseTargetSets(currentExId) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 w-3 rounded-full',
                        i < getExerciseDoneCount(currentExId) ? 'bg-primary' : i === getExerciseDoneCount(currentExId) ? 'bg-accent-amber' : 'bg-muted',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none bg-muted/40 ring-primary/20 transition-all focus-within:ring-2 hover:bg-muted/50">
                <CardContent className="flex flex-col items-center gap-1 p-4">
                  <span className="text-[10px] font-black uppercase opacity-40">Recorded Reps</span>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-background shadow-sm"
                      onClick={() => setActualReps((r) => Math.max(1, r - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center text-3xl font-black italic">{actualReps}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-background shadow-sm"
                      onClick={() => setActualReps((r) => r + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/40 ring-primary/20 transition-all focus-within:ring-2 hover:bg-muted/50">
                <CardContent className="flex flex-col items-center gap-1 p-4">
                  <span className="text-[10px] font-black uppercase opacity-40">Adjusted (kg)</span>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-background shadow-sm"
                      onClick={() => setActualWeight((w) => Math.max(0, w - (currentExercise?.weightStep || 2.5)))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-2xl font-black italic">{actualWeight}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-background shadow-sm"
                      onClick={() => setActualWeight((w) => w + (currentExercise?.weightStep || 2.5))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="group relative flex flex-col overflow-hidden border-none bg-muted/20 shadow-none">
            <CardContent className="relative flex min-h-[320px] items-center justify-center p-0">
                <div className="relative flex aspect-square w-full max-w-[280px] items-center justify-center">
                    <ChartContainer config={chartConfig} className="absolute inset-10">
                    <RadialBarChart
                        data={chartData}
                        startAngle={90}
                        endAngle={90 + (timer / 60) * 360}
                        innerRadius="70%"
                        outerRadius="90%"
                        barSize={20}
                    >
                        <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                        polarRadius={[75, 95]}
                        />
                        <RadialBar dataKey="time" background cornerRadius={10} />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                            content={({ viewBox }) => {
                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-5xl font-black leading-none">
                                    {timer}
                                    </tspan>
                                    <tspan x={viewBox.cx} y={viewBox.cy + 24} className="fill-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                    Seconds
                                    </tspan>
                                </text>
                                );
                            }
                            }}
                        />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                    </ChartContainer>

                    {/* Decorative Ring */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-primary/10" />
                </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            variant="outline"
            className="h-16 w-full border-2 text-lg font-black italic shadow-lg"
            onClick={handleNextStep}
          >
            SKIP TIMER
          </Button>
        </div>
      )}

      <Drawer open={isSelectionDrawerOpen} onOpenChange={setIsSelectionDrawerOpen}>
        <DrawerContent className="h-[85vh] border-none bg-background">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col overflow-hidden">
            <DrawerHeader className="shrink-0 text-left">
              <DrawerTitle className="text-2xl font-black italic">SWITCH EXERCISE</DrawerTitle>
              <DrawerDescription className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                Switching active targets
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 py-2 pb-20">
              {Object.entries(groupedExercises).map(([group, exercises]) => (
                <div key={group} className="flex flex-col gap-3">
                  <h3 className="mt-4 px-1 text-xs font-black tracking-widest text-primary uppercase">{group}</h3>
                  <div className="flex flex-col gap-3">
                    {exercises.map((ex) => renderExerciseSelectionGroup(ex))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
