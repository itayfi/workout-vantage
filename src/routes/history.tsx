import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useWorkoutHistory, type CompletedWorkout, type PerformanceLog } from '@/stores/workout-history-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, TrendingUp, Calendar, Zap, Weight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryView,
});

function HistoryView() {
  const { history, _hasHydrated } = useWorkoutHistory();
  const [openWorkouts, setOpenWorkouts] = React.useState<Record<string, boolean>>({});

  const toggleWorkout = (id: string) => {
    setOpenWorkouts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!_hasHydrated) {
    return (
      <div className="flex animate-pulse flex-col gap-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight italic">HISTORY</h1>
        <div className="h-32 rounded-xl bg-muted/20" />
        <div className="h-32 rounded-xl bg-muted/20" />
      </div>
    );
  }

  return (
    <div className="flex animate-in flex-col gap-6 pb-20 duration-500 slide-in-from-left-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tighter italic">WORKOUT HISTORY</h1>
          <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Your journey so far</p>
        </div>
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/50 bg-muted/10 p-16 text-center">
            <History className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="flex flex-col gap-1">
              <p className="font-black text-muted-foreground uppercase italic">No workouts logged yet</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Time to hit the iron!</p>
            </div>
          </div>
        ) : (
          history.map((session: CompletedWorkout) => (
            <Collapsible 
              key={session.id} 
              open={openWorkouts[session.id]} 
              onOpenChange={() => toggleWorkout(session.id)}
            >
              <Card className={cn(
                "overflow-hidden border border-none border-border/10 bg-muted/30 transition-all",
                openWorkouts[session.id] && "bg-muted/50 ring-2 ring-primary/20"
              )}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="group relative flex cursor-pointer flex-row items-center justify-between space-y-0 py-6">
                    <div className="relative z-10 flex flex-col gap-1">
                      <span className="text-[10px] leading-none font-black tracking-widest text-primary uppercase">{session.planName}</span>
                      <CardTitle className="mt-1 text-2xl leading-none font-black tracking-tighter italic">{format(session.startTime, 'MMM d, yyyy')}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase">
                        <Calendar className="h-2.5 w-2.5 leading-none" />
                        {format(session.startTime, 'HH:mm')} — {format(session.endTime, 'HH:mm')}
                      </CardDescription>
                    </div>
                    <div className="relative z-10 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-primary uppercase">
                           <Zap className="h-2 w-2 fill-current" />
                           Done
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", openWorkouts[session.id] && "rotate-180")} />
                    </div>
                    <Weight className="absolute -top-4 -right-4 h-24 w-24 rotate-12 opacity-[0.03]" />
                  </CardHeader>
                </CollapsibleTrigger>

                <CardContent className="pb-6">
                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-6">
                      <div className="flex flex-col">
                          <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Intensity</span>
                          <span className="flex items-center gap-1 text-xl font-black text-accent-amber italic">
                              <TrendingUp className="h-4 w-4" />
                              {session.totalSets} <span className="ml-1 text-[10px] uppercase ml-1 opacity-40">Sets</span>
                          </span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Scope</span>
                          <span className="text-xl font-black italic">
                              {session.totalExercises} <span className="ml-1 text-[10px] uppercase ml-1 opacity-40">Groups</span>
                          </span>
                      </div>
                  </div>

                  <CollapsibleContent className="mt-6 animate-in space-y-4 duration-300 slide-in-from-top-2">
                    <Separator className="bg-border/30" />
                    <div className="space-y-3">
                       <span className="px-1 text-[9px] font-black tracking-[0.2em] uppercase opacity-30">Session Breakdown</span>
                       {Object.entries(session.logs).sort((a,b) => Number(a[0]) - Number(b[0])).map(([slotIdx, slotMachines]) => {
                          // Compatibility check for legacy flat array format
                          const machineGroups = Array.isArray(slotMachines) 
                            ? { "legacy": slotMachines as PerformanceLog[] }
                            : slotMachines as Record<string, PerformanceLog[]>;

                          const machineList = Object.values(machineGroups);
                          const firstLog = machineList[0]?.[0];
                          const muscleName = firstLog?.muscleName || `Group ${Number(slotIdx) + 1}`;
                          const allSets = machineList.flat();
                          
                          return (
                            <div key={slotIdx} className="space-y-3 rounded-xl border border-border/10 bg-background/20 p-4">
                               <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                  <span className="max-w-[200px] truncate text-[10px] font-black tracking-wider text-primary uppercase">
                                     {muscleName}
                                  </span>
                                  <span className="text-[8px] font-bold uppercase opacity-40">{allSets.length} sets</span>
                               </div>
                               
                               {Object.entries(machineGroups).map(([mId, mLogs], gIdx) => (
                                   <div key={mId + gIdx} className="space-y-1.5">
                                      <div className="text-[10px] font-black uppercase italic opacity-80">{mLogs[0]?.machineName || "Exercise"}</div>
                                      <div className="grid grid-cols-3 gap-2">
                                         {mLogs.map((s, sIdx) => (
                                            <div key={sIdx} className="flex flex-col items-center rounded-lg border border-border/10 bg-background/40 p-2">
                                               <span className="mb-1 text-[7px] font-black uppercase opacity-20">Set {sIdx + 1}</span>
                                               <div className="flex items-center gap-1 leading-none font-black">
                                                  <span className="text-sm italic">{s.reps}</span>
                                                  <span className="text-[7px] tracking-tighter opacity-40">×</span>
                                                  <span className="text-sm text-accent-amber italic">{s.weight}</span>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                ))}
                            </div>
                          );
                       })}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}
