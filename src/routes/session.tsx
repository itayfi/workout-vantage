import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { useWorkoutPlans } from '@/stores/workout-plans-storage';
import { useActiveSession } from '@/stores/active-session-storage';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    currentSlotIndex,
    currentSetIndex,
    selectedMachineId,
    logs,
    _hasHydrated: sessionHydrated,
    startSession,
    updateStatus,
    updateSet,
    updateMachine,
    logSet,
    resetSession,
  } = useActiveSession();

  const [actualReps, setActualReps] = React.useState(12);
  const [actualWeight, setActualWeight] = React.useState(20);
  const [timer, setTimer] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [isMachineDrawerOpen, setIsMachineDrawerOpen] = React.useState(false);

  const activePlan = plans.find((p) => p.id === activePlanId);
  const currentSlot = activePlan?.slots[currentSlotIndex];
  const currentMachine = currentSlot?.alternatives.find((a) => a.id === selectedMachineId);

  // Sync state with current set/slot when they change
  React.useEffect(() => {
    if (currentSlot) {
      setActualReps(currentSlot.targetReps);
      // Use target weight if available, otherwise fallback to a sensible default or the weight from the last set's log
      setActualWeight(currentSlot.targetWeight ?? 20);
    }
  }, [currentSlotIndex, currentSetIndex, currentSlot]);

  // Auto-open drawer if machine not selected
  React.useEffect(() => {
    if (status === 'EXERCISE' && activePlan && currentSlot && !selectedMachineId && !isMachineDrawerOpen) {
      setIsMachineDrawerOpen(true);
    }
  }, [status, activePlan, currentSlot, selectedMachineId, isMachineDrawerOpen]);

  // Timer logic
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer]);

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
      startSession(planId, plan.slots[0]?.alternatives[0]?.id || null);
    }
  };

  const handleCompleteSet = () => {
    logSet(currentSlotIndex, currentSetIndex, { reps: actualReps, weight: actualWeight });
    setTimer(60);
    setIsTimerRunning(true);
    updateStatus('RESTING');
  };

  const handleNextStep = () => {
    if (!currentSlot) return;

    if (currentSetIndex < currentSlot.targetSets - 1) {
      updateSet(currentSlotIndex, currentSetIndex + 1);
      updateStatus('EXERCISE');
    } else if (activePlan && currentSlotIndex < activePlan.slots.length - 1) {
      const nextSlotIndex = currentSlotIndex + 1;
      updateSet(nextSlotIndex, 0);
      updateMachine(activePlan.slots[nextSlotIndex]?.alternatives[0]?.id || null);
      updateStatus('EXERCISE');
    } else {
      updateStatus('SUMMARY');
    }
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
                    {plan.slots.length} exercises
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
      <div className="flex animate-in flex-col gap-8 py-12 text-center duration-500 zoom-in-95 fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-gold/20 text-accent-gold">
          <Zap className="h-10 w-10 fill-current" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black italic">WORKOUT COMPLETE</h1>
          <p className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">You absolute beast!</p>
        </div>
        <Card className="border-none bg-muted/30">
          <CardContent className="grid grid-cols-2 gap-4 p-6">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black uppercase opacity-50">Exercises</span>
              <span className="text-2xl font-black">{activePlan?.slots.length}</span>
            </div>
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black text-accent-amber uppercase opacity-50">Total Sets</span>
              <span className="text-2xl font-black text-accent-amber italic">{Object.values(logs).flat().length}</span>
            </div>
          </CardContent>
        </Card>
        <Button size="lg" className="h-16 w-full text-xl font-black italic" onClick={resetSession}>
          DONE
        </Button>
      </div>
    );
  }

  const chartData = [{ time: timer, fill: 'var(--color-time)' }];

  return (
    <div className="flex animate-in flex-col gap-6 pb-32 duration-500 slide-in-from-right-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-primary uppercase opacity-80">
              {activePlan?.name}
            </span>
            <span className="h-1 w-1 rounded-full bg-primary/30" />
            <span className="text-[10px] font-black uppercase opacity-40">{status}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight italic">{currentSlot?.targetMuscle}</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 opacity-40 hover:opacity-100">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-border/50 bg-card">
            <DropdownMenuItem onClick={resetSession} className="cursor-pointer font-bold text-destructive">
              <Power className="mr-2 h-4 w-4" />
              Quit Workout
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus('SELECTING')} className="cursor-pointer font-medium">
              <RotateCcw className="mr-2 h-4 w-4" />
              Change Plan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {status === 'EXERCISE' ? (
        <div className="flex animate-in flex-col gap-6 duration-500 slide-in-from-right-8">
          <Card className="overflow-hidden border-none bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl leading-none font-black italic">{currentMachine?.name}</span>
                  <span className="mt-1 text-[10px] font-bold tracking-widest uppercase opacity-70">
                    {currentMachine?.machineType} • {currentMachine?.weightStep}kg step
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-[10px] font-black tracking-widest uppercase"
                  onClick={() => setIsMachineDrawerOpen(true)}
                >
                  Change
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase opacity-60">Session Progress</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black italic">{currentSetIndex + 1}</span>
                    <span className="text-xl font-bold opacity-30">/ {currentSlot?.targetSets}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl border border-accent-gold/20 bg-black/20 p-4 backdrop-blur-md">
                  <span className="text-[10px] font-black text-accent-gold uppercase opacity-60">Target Goal</span>
                  <div className="flex flex-col leading-none">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-accent-amber italic">{currentSlot?.targetReps}</span>
                      <span className="text-[8px] font-bold text-accent-amber uppercase opacity-60">Reps</span>
                    </div>
                    {currentSlot?.targetWeight !== undefined && (
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-accent-gold italic">{currentSlot.targetWeight}</span>
                        <span className="text-[8px] font-bold text-accent-gold uppercase opacity-60">kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {Array.from({ length: currentSlot?.targetSets || 0 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                      i < currentSetIndex
                        ? 'bg-white'
                        : i === currentSetIndex
                          ? 'animate-pulse bg-accent-amber'
                          : 'bg-white/20',
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="group relative h-24 w-full overflow-hidden text-2xl font-black italic shadow-2xl shadow-primary/40"
            onClick={handleCompleteSet}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Check className="h-8 w-8 stroke-3" />
              DONE - START REST
            </span>
            <div className="absolute inset-x-0 bottom-0 h-0 bg-white/10 transition-all duration-200 group-active:h-full" />
          </Button>
        </div>
      ) : (
        <div className="flex animate-in flex-col gap-6 duration-500 slide-in-from-right-8">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none bg-muted/40 ring-primary/20 transition-all focus-within:ring-2 hover:bg-muted/50">
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <span className="text-[10px] font-black uppercase opacity-40">Actual Reps</span>
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
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <span className="text-[10px] font-black uppercase opacity-40">Weight (kg)</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background shadow-sm"
                    onClick={() => setActualWeight((w) => Math.max(0, w - (currentMachine?.weightStep || 2.5)))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-2xl font-black italic">{actualWeight}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background shadow-sm"
                    onClick={() => setActualWeight((w) => w + (currentMachine?.weightStep || 2.5))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="group relative flex flex-col overflow-hidden border-none bg-muted/20 shadow-none">
            <CardContent className="relative flex min-h-[320px] items-center justify-center p-0">
              <div className="relative flex aspect-square w-full max-w-[280px] items-center justify-center">
                <ChartContainer config={chartConfig} className="absolute inset-10">
                  <RadialBarChart
                    data={chartData}
                    startAngle={90}
                    endAngle={90 + (timer / 60) * 360}
                    innerRadius="65%"
                    outerRadius="90%"
                    barSize={20}
                  >
                    <PolarGrid
                      gridType="circle"
                      radialLines={false}
                      stroke="none"
                      className="first:fill-muted last:fill-background"
                      polarRadius={[70, 95]}
                    />
                    <RadialBar dataKey="time" background cornerRadius={10} />
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-5xl font-black">
                                  {timer}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 25}
                                  className="fill-accent-amber text-[10px] font-black tracking-widest uppercase"
                                >
                                  Seconds Rest
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </PolarRadiusAxis>
                  </RadialBarChart>
                </ChartContainer>

                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-muted/30 transition-colors hover:bg-muted/50"
                    onClick={() => setTimer(60)}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="h-20 w-full text-xl font-black shadow-lg" onClick={handleNextStep}>
              {currentSetIndex < (currentSlot?.targetSets || 0) - 1 ? 'NEXT SET' : 'NEXT EXERCISE'}
            </Button>
            <Button
              variant="ghost"
              className="text-[10px] font-black tracking-widest uppercase opacity-40 hover:opacity-100"
              onClick={handleNextStep}
            >
              Skip Rest
            </Button>
          </div>
        </div>
      )}

      <Drawer open={isMachineDrawerOpen} onOpenChange={setIsMachineDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle className="text-center text-2xl font-black italic">SELECT MACHINE</DrawerTitle>
            </DrawerHeader>
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto p-4">
              {currentSlot?.alternatives.map((alt) => (
                <Card
                  key={alt.id}
                  className={cn(
                    'cursor-pointer border-2 border-none shadow-none transition-all active:scale-[0.98]',
                    selectedMachineId === alt.id ? 'bg-primary text-primary-foreground' : 'bg-muted/30',
                  )}
                  onClick={() => {
                    updateMachine(alt.id);
                    setIsMachineDrawerOpen(false);
                  }}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex flex-col">
                      <span className="text-lg font-black italic">{alt.name}</span>
                      <span className="text-[10px] font-bold tracking-tighter uppercase opacity-60">
                        {alt.machineType}
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4',
                        selectedMachineId === alt.id ? 'text-primary-foreground' : 'text-primary',
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
            <DrawerFooter className="pb-8">
              <Button type="button" className="w-full font-black" onClick={() => setIsMachineDrawerOpen(false)}>
                CONFIRM SELECTION
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
