import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { useWorkoutPlans } from '@/stores/workout-plans-storage';
import { useActiveSession } from '@/stores/active-session-storage';
import { useWorkoutHistory } from '@/stores/workout-history-storage';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { 
  Play, 
  ChevronRight, 
  Check, 
  RefreshCcw, 
  Loader2, 
  Minus, 
  Plus, 
  Zap, 
  MoreHorizontal, 
  Power, 
  RotateCcw, 
  SkipForward, 
  PlusCircle,
  LayoutGrid,
  CheckCircle2,
  ListIcon,
  Flag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session',
  component: Session,
});

const chartConfig = {
  time: {
    label: "Seconds",
    color: "var(--accent-amber)",
  },
} satisfies ChartConfig;

function Session() {
  const { plans, _hasHydrated: plansHydrated } = useWorkoutPlans();
  const { 
    status, activePlanId, currentSlotIndex, currentSetIndex, selectedMachineId, logs, sessionTargetSets, startTime, _hasHydrated: sessionHydrated,
    startSession, updateStatus, updateSet, updateMachine, logSet, addExtraSet, capSessionSets, resetSession 
  } = useActiveSession();
  const { addWorkout } = useWorkoutHistory();

  const [actualReps, setActualReps] = React.useState(12);
  const [actualWeight, setActualWeight] = React.useState(20);
  const [timer, setTimer] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [isSelectionDrawerOpen, setIsSelectionDrawerOpen] = React.useState(false);

  const activePlan = plans.find(p => p.id === activePlanId);
  const currentSlot = activePlan?.slots[currentSlotIndex];
  const currentMachine = currentSlot?.alternatives.find(a => a.id === selectedMachineId);
  const currentTargetSetsCount = sessionTargetSets[currentSlotIndex] || currentSlot?.targetSets || 0;

  const isSlotDone = React.useCallback((idx: number) => {
    const slotLogs = logs[idx] || [];
    const targets = sessionTargetSets[idx] || activePlan?.slots[idx]?.targetSets || 0;
    return slotLogs.length >= targets && targets > 0;
  }, [logs, sessionTargetSets, activePlan]);

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
        totalExercises
     });
     
     updateStatus('SUMMARY');
  }, [activePlan, logs, sessionTargetSets, startTime, addWorkout, updateStatus]);

  const updateSlotIndex = React.useCallback((newIdx: number) => {
    if (newIdx !== currentSlotIndex) {
       const currentProgress = (logs[currentSlotIndex] || []).length;
       const currentTarget = sessionTargetSets[currentSlotIndex] || activePlan?.slots[currentSlotIndex]?.targetSets || 0;
       
       if (currentProgress > 0 && currentProgress < currentTarget) {
          capSessionSets(currentSlotIndex, currentProgress);
       }
    }

    updateSet(newIdx, 0);
    const logsExist = (logs[newIdx] || []).length > 0;
    if (!logsExist) {
       updateMachine(null); 
    }
  }, [currentSlotIndex, logs, sessionTargetSets, activePlan, capSessionSets, updateSet, updateMachine]);

  const handleNextStep = React.useCallback(() => {
    if (!currentSlot) return;

    if (currentSetIndex < currentTargetSetsCount - 1) {
      updateSet(currentSlotIndex, currentSetIndex + 1);
      updateStatus('EXERCISE');
    } else {
      updateStatus('CHOOSING_NEXT');
    }
    setIsTimerRunning(false);
    setTimer(0);
  }, [currentSlot, currentSetIndex, currentTargetSetsCount, currentSlotIndex, updateSet, updateStatus]);

  // Sync state with current set/slot when they change
  React.useEffect(() => {
    if (currentSlot) {
      setActualReps(currentSlot.targetReps);
      setActualWeight(currentSlot.targetWeight ?? 20);
    }
  }, [currentSlotIndex, currentSetIndex, currentSlot]);

  // Auto-open drawer if machine/slot not selected or if starting
  React.useEffect(() => {
    if (status === 'EXERCISE' && activePlan && !selectedMachineId && !isSelectionDrawerOpen) {
      setIsSelectionDrawerOpen(true);
    }
  }, [status, activePlan, selectedMachineId, isSelectionDrawerOpen]);

  // Timer logic + Auto progression
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
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerRunning, timer, handleNextStep]);

  if (!plansHydrated || !sessionHydrated) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <span className="text-xs font-black uppercase tracking-widest opacity-20">Initializing Session</span>
      </div>
    );
  }

  const handleStartSession = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const initialSlots = plan.slots.map((s, idx) => ({ slotIndex: idx, sets: s.targetSets }));
      startSession(planId, null, initialSlots); 
    }
  };

  const handleCompleteSet = () => {
    logSet(currentSlotIndex, currentSetIndex, { reps: actualReps, weight: actualWeight });
    setTimer(60);
    setIsTimerRunning(true);
    updateStatus('RESTING');
  };

  const skipToNextExercise = () => {
    const currentProgress = (logs[currentSlotIndex] || []).length;
    const currentTarget = sessionTargetSets[currentSlotIndex] || activePlan?.slots[currentSlotIndex]?.targetSets || 0;

    if (currentProgress > 0 && currentProgress < currentTarget) {
       capSessionSets(currentSlotIndex, currentProgress);
    }

    updateStatus('CHOOSING_NEXT');
    setIsTimerRunning(false);
    setTimer(0);
  };

  if (status === 'SELECTING') {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <h1 className="font-heading text-3xl font-bold italic tracking-tighter">START SESSION</h1>
        <div className="grid gap-4">
          {plans.map(plan => (
            <Card 
              key={plan.id} 
              className="group cursor-pointer border-none bg-muted/30 hover:bg-primary transition-all active:scale-95 overflow-hidden"
              onClick={() => handleStartSession(plan.id)}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-xl group-hover:text-primary-foreground">{plan.name}</span>
                  <span className="text-xs opacity-50 uppercase font-black tracking-widest group-hover:text-primary-foreground/70">{plan.slots.length} exercises</span>
                </div>
                <Play className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </CardContent>
            </Card>
          ))}
          <Link to="/plans/$planId" params={{ planId: 'new' }} className="w-full">
            <Button variant="outline" className="w-full h-16 border-dashed border-2 opacity-60">
              Create New Plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'SUMMARY') {
     return (
        <div className="flex flex-col gap-8 text-center animate-in fade-in zoom-in-95 duration-500 py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-gold/20 text-accent-gold border-2 border-accent-gold animate-pulse">
               <Zap className="h-10 w-10 fill-current" />
            </div>
            <div className="flex flex-col gap-2">
               <h1 className="text-4xl font-black italic">WORKOUT COMPLETE</h1>
               <p className="text-muted-foreground uppercase text-xs font-black tracking-[0.2em]">You absolute beast!</p>
            </div>
            <Card className="bg-muted/30 border-none">
               <CardContent className="p-6 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-left">
                     <span className="text-[10px] font-black uppercase opacity-50">Exercises</span>
                     <span className="text-2xl font-black">{Object.keys(logs).length}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                     <span className="text-[10px] font-black text-accent-amber uppercase opacity-50">Total Sets</span>
                     <span className="text-2xl font-black italic text-accent-amber">{Object.values(logs).flat().length}</span>
                  </div>
               </CardContent>
            </Card>
            <Button size="lg" className="h-16 text-xl font-black italic w-full" onClick={resetSession}>DONE</Button>
        </div>
     );
  }

  if (status === 'CHOOSING_NEXT') {
    const remainingSlots = activePlan?.slots
      .map((s, idx) => ({ ...s, idx }))
      .filter(s => !isSlotDone(s.idx)) || [];
    
    const completedSlots = activePlan?.slots
      .map((s, idx) => ({ ...s, idx }))
      .filter(s => isSlotDone(s.idx)) || [];

    return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-32">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase text-primary tracking-widest">{activePlan?.name}</span>
          <h1 className="text-4xl font-black italic">CHOOSE NEXT STEP</h1>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase opacity-40 px-1">Remaining in Plan</span>
            <div className="grid gap-3">
              {remainingSlots.length > 0 ? (
                remainingSlots.map((slot) => (
                  <Card 
                    key={slot.id} 
                    className="border-none bg-muted/40 hover:bg-muted/60 transition-all cursor-pointer"
                    onClick={() => {
                      updateSlotIndex(slot.idx);
                      updateStatus('EXERCISE');
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm text-primary">
                           <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black italic uppercase tracking-tight">{slot.targetMuscle}</span>
                          <span className="text-[10px] uppercase font-bold opacity-60">{slot.alternatives[0]?.name} • {slot.targetSets} sets</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl">
                   <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                   <p className="text-xs font-black uppercase tracking-widest opacity-40">All planned exercises completed</p>
                </div>
              )}
            </div>
          </div>

          {completedSlots.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase opacity-40 px-1">Completed</span>
              <div className="grid gap-3">
                {completedSlots.map((slot) => (
                  <Card 
                    key={slot.id} 
                    className="border-none bg-muted/20 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                    onClick={() => {
                      updateSlotIndex(slot.idx);
                      updateStatus('EXERCISE');
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm text-muted-foreground">
                           <Check className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black italic text-sm">{slot.targetMuscle}</span>
                        </div>
                      </div>
                      <RotateCcw className="h-4 w-4 opacity-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <Button variant="ghost" className="h-20 w-full border-2 border-dashed border-border/50 text-muted-foreground font-black italic text-lg" onClick={finalizeWorkout}>
            FINISH WORKOUT
          </Button>
        </div>
      </div>
    );
  }

  const chartData = [{ time: timer, fill: "var(--color-time)" }];

  const allSlotsPartitioned = (() => {
    if (!activePlan) return { current: null, remaining: [], completed: [] };
    const currentIdx = currentSlotIndex;
    
    const slotsWithIdx = activePlan.slots.map((s, idx) => ({ ...s, idx }));
    const current = slotsWithIdx.find(s => s.idx === currentIdx) || null;
    const others = slotsWithIdx.filter(s => s.idx !== currentIdx);
    
    const remaining = others.filter(s => !isSlotDone(s.idx));
    const completed = others.filter(s => isSlotDone(s.idx));
    
    return { current, remaining, completed };
  })();

  const renderSlotGroup = (slot: any, isCurrent: boolean) => (
    <div key={slot.id} className="flex flex-col gap-2">
       <div className="flex items-center gap-2 px-1">
          <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", isCurrent ? "text-accent-amber" : "text-primary")}>
             {isCurrent ? 'ACTIVE TARGET' : slot.targetMuscle}
          </span>
          {isSlotDone(slot.idx) && <Check className="h-3 w-3 text-primary" />}
       </div>
       <div className="grid gap-2">
          {slot.alternatives.map((alt: any) => (
            <Card 
               key={alt.id} 
               className={cn(
                  "cursor-pointer transition-all active:scale-[0.98] border-2 shadow-none relative overflow-hidden", 
                  selectedMachineId === alt.id && currentSlotIndex === slot.idx ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-transparent"
               )}
               onClick={() => {
                  updateSlotIndex(slot.idx);
                  updateMachine(alt.id);
                  updateStatus('EXERCISE');
                  setIsSelectionDrawerOpen(false);
               }}
            >
               <CardContent className="p-4 flex justify-between items-center relative z-10">
                  <div className="flex flex-col">
                     <span className="font-black text-lg italic tracking-tight">{alt.name}</span>
                     <span className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">{alt.machineType}</span>
                  </div>
                  <ChevronRight className={cn("h-4 w-4", selectedMachineId === alt.id && currentSlotIndex === slot.idx ? "text-primary-foreground" : "text-primary")} />
               </CardContent>
            </Card>
          ))}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-40 animate-in fade-in slide-in-from-right-5 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black uppercase text-primary tracking-widest opacity-80">{activePlan?.name}</span>
             <span className="h-1 w-1 rounded-full bg-primary/30" />
             <span className="text-[10px] font-black uppercase opacity-40">{status}</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tight">{currentSlot?.targetMuscle}</h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 opacity-40 hover:opacity-100">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border/50">
            <DropdownMenuItem onClick={skipToNextExercise} className="font-bold cursor-pointer">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Exercise
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus('SELECTING')} className="font-medium cursor-pointer">
              <RotateCcw className="mr-2 h-4 w-4" />
              Change Plan
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={resetSession} className="font-bold cursor-pointer">
              <Power className="mr-2 h-4 w-4" />
              Quit Workout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {status === 'EXERCISE' ? (
        <div className="flex animate-in flex-col gap-6 slide-in-from-right-8 duration-500">
           <Card className="border-none bg-muted/40 shadow-none border border-border/30 overflow-hidden">
              <CardContent className="p-6 flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       {currentMachine ? (
                         <>
                           <span className="text-2xl font-black italic leading-none">{currentMachine.name}</span>
                           <span className="mt-1 text-[10px] uppercase font-bold opacity-40 tracking-widest">{currentMachine.machineType} • {currentMachine.weightStep}kg step</span>
                         </>
                       ) : (
                         <span className="text-2xl font-black italic leading-none opacity-40 italic">Select Device...</span>
                       )}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-background/50" onClick={() => setIsSelectionDrawerOpen(true)}>
                       Change
                    </Button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-4 border border-border/50">
                       <span className="text-[10px] font-black uppercase opacity-40">Set Goal</span>
                       <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black italic">{currentSetIndex + 1}</span>
                          <span className="text-xl font-bold opacity-20">/ {currentTargetSetsCount}</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-4 border border-accent-gold/10">
                       <span className="text-[10px] font-black uppercase opacity-40">Target Stats</span>
                       <div className="flex flex-col leading-tight">
                          <div className="flex items-baseline gap-1">
                             <span className="text-2xl font-black italic text-accent-amber">{currentSlot?.targetReps}</span>
                             <span className="text-[8px] font-bold uppercase opacity-60 text-accent-amber">Reps</span>
                          </div>
                          {currentSlot?.targetWeight !== undefined && (
                             <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-2xl font-black italic text-accent-gold">{currentSlot.targetWeight}</span>
                                <span className="text-[8px] font-bold uppercase opacity-60 text-accent-gold">kg</span>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <div className="flex-1 flex gap-2">
                       {Array.from({ length: currentTargetSetsCount }).map((_, i) => (
                          <div 
                             key={i} 
                             className={cn(
                                "h-1.5 flex-1 rounded-full transition-all duration-300",
                                i < currentSetIndex ? "bg-primary" : 
                                i === currentSetIndex ? "bg-accent-amber animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.4)]" : 
                                "bg-muted"
                             )} 
                          />
                       ))}
                    </div>
                    <Button 
                       type="button" 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted"
                       onClick={() => addExtraSet(currentSlotIndex)}
                    >
                       <PlusCircle className="h-5 w-5 text-primary" />
                    </Button>
                 </div>
              </CardContent>
           </Card>

           <Button 
              size="lg" 
              disabled={!currentMachine}
              className="h-24 w-full text-2xl font-black italic shadow-2xl shadow-primary/20 group relative overflow-hidden"
              onClick={handleCompleteSet}
           >
              <span className="relative z-10 flex items-center gap-3">
                 <Check className="h-8 w-8 stroke-3" />
                 DONE - START REST
              </span>
              <div className="absolute inset-x-0 bottom-0 h-0 bg-white/10 group-active:h-full transition-all duration-200" />
           </Button>
        </div>
      ) : (
        <div className="flex animate-in flex-col gap-6 slide-in-from-right-8 duration-500">
           {/* Context Card for Rest View */}
           <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                 <div className="flex items-center gap-2">
                    <div className="flex h-6 items-center px-2 rounded-full bg-accent-amber/10 border border-accent-amber/20">
                       <span className="text-[10px] font-black text-accent-amber uppercase tracking-widest">Set {currentSetIndex + 1}</span>
                       <span className="mx-1 text-[10px] opacity-30 text-accent-amber">/</span>
                       <span className="text-[10px] font-black text-accent-amber/50">{currentTargetSetsCount}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Rest Tracking</span>
                 </div>
                 <div className="flex gap-1.5">
                    {Array.from({ length: currentTargetSetsCount }).map((_, i) => (
                       <div key={i} className={cn("h-1 w-3 rounded-full", i === currentSetIndex ? "bg-accent-amber" : i < currentSetIndex ? "bg-primary" : "bg-muted")} />
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <Card className="border-none bg-muted/40 transition-all hover:bg-muted/50 focus-within:ring-2 ring-primary/20">
                    <CardContent className="p-4 flex flex-col items-center gap-1">
                       <span className="text-[10px] font-black uppercase opacity-40">Recorded Reps</span>
                       <div className="flex items-center gap-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm" onClick={() => setActualReps(r => Math.max(1, r - 1))}>
                             <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-3xl font-black italic w-10 text-center">{actualReps}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm" onClick={() => setActualReps(r => r + 1)}>
                             <Plus className="h-4 w-4" />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
                 <Card className="border-none bg-muted/40 transition-all hover:bg-muted/50 focus-within:ring-2 ring-primary/20">
                    <CardContent className="p-4 flex flex-col items-center gap-1">
                       <span className="text-[10px] font-black uppercase opacity-40">Adjusted (kg)</span>
                       <div className="flex items-center gap-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm" onClick={() => setActualWeight(w => Math.max(0, w - (currentMachine?.weightStep || 2.5)))}>
                             <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-2xl font-black italic w-12 text-center">{actualWeight}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm" onClick={() => setActualWeight(w => w + (currentMachine?.weightStep || 2.5))}>
                             <Plus className="h-4 w-4" />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
              </div>
           </div>

           <Card className="flex flex-col border-none bg-muted/20 shadow-none overflow-hidden relative group">
             <CardContent className="flex p-0 items-center justify-center min-h-[320px] relative">
               <div className="w-full max-w-[280px] aspect-square relative flex items-center justify-center">
                 <ChartContainer
                   config={chartConfig}
                   className="absolute inset-10"
                 >
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
                           if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                             return (
                               <text
                                 x={viewBox.cx}
                                 y={viewBox.cy}
                                 textAnchor="middle"
                                 dominantBaseline="middle"
                               >
                                 <tspan
                                   x={viewBox.cx}
                                   y={viewBox.cy}
                                   className="fill-foreground text-5xl font-black"
                                 >
                                   {timer}
                                 </tspan>
                                 <tspan
                                   x={viewBox.cx}
                                   y={(viewBox.cy || 0) + 25}
                                   className="fill-accent-amber text-[10px] uppercase font-black tracking-widest"
                                 >
                                   Seconds Rest
                                 </tspan>
                               </text>
                             )
                           }
                         }}
                       />
                     </PolarRadiusAxis>
                   </RadialBarChart>
                 </ChartContainer>
                 
                 <div className="absolute inset-x-0 bottom-4 flex justify-center items-center gap-4">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors" onClick={() => setTimer(60)}>
                       <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button 
                       type="button" 
                       variant="outline" 
                       size="icon" 
                       className="h-10 w-10 rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                       title="Add extra set"
                       onClick={() => addExtraSet(currentSlotIndex)}
                    >
                       <PlusCircle className="h-5 w-5" />
                    </Button>
                 </div>
               </div>
             </CardContent>
           </Card>

           <div className="flex flex-col gap-3">
              <Button 
                 size="lg" 
                 className="h-20 w-full text-xl font-black shadow-lg" 
                 onClick={handleNextStep}
              >
                 {currentSetIndex < currentTargetSetsCount - 1 ? 'NEXT SET' : 'PROCEED TO NEXT'}
              </Button>
              <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100" onClick={skipToNextExercise}>
                 Skip to Next Exercise
              </Button>
           </div>
        </div>
      )}

      {/* Unified Selection Drawer */}
      <Drawer open={isSelectionDrawerOpen} onOpenChange={setIsSelectionDrawerOpen}>
        <DrawerContent className="h-[85vh]">
          <div className="mx-auto w-full max-w-sm flex flex-col h-full overflow-hidden">
            <DrawerHeader className="shrink-0">
              <DrawerTitle className="text-2xl font-black italic text-center">CHOOSE EXERCISE</DrawerTitle>
              <DrawerDescription className="text-center text-[10px] uppercase font-bold opacity-40">Select which group or machine to tackle next</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-20">
              {/* 1. Current Active Target */}
              {allSlotsPartitioned.current && (
                 <div className="space-y-4">
                    {renderSlotGroup(allSlotsPartitioned.current, true)}
                 </div>
              )}

              {/* 2. Remaining/Planned order */}
              {allSlotsPartitioned.remaining.length > 0 && (
                <div className="space-y-6">
                   <div className="flex items-center gap-3 opacity-30">
                      <ListIcon className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Plan Progression</span>
                      <Separator className="flex-1" />
                   </div>
                   {allSlotsPartitioned.remaining.map(s => renderSlotGroup(s, false))}
                </div>
              )}

              {/* 3. Already Done */}
              {allSlotsPartitioned.completed.length > 0 && (
                <div className="space-y-6">
                   <div className="flex items-center gap-3 opacity-30">
                      <Flag className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Already Completed</span>
                      <Separator className="flex-1" />
                   </div>
                   <div className="opacity-60 grayscale-[0.5]">
                      {allSlotsPartitioned.completed.map(s => renderSlotGroup(s, false))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
