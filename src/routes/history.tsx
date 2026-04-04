import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useWorkoutHistory, type CompletedWorkout } from '@/stores/workout-history-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, TrendingUp, Calendar, Zap, Weight } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryView,
});

function HistoryView() {
  const { history, _hasHydrated } = useWorkoutHistory();

  if (!_hasHydrated) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <h1 className="font-heading text-3xl font-bold tracking-tight italic">HISTORY</h1>
        <div className="h-32 bg-muted/20 rounded-xl" />
        <div className="h-32 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-5 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-black italic tracking-tighter">WORKOUT HISTORY</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest opacity-60">Your journey so far</p>
        </div>
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border/50 rounded-2xl p-16 text-center bg-muted/10">
            <History className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground font-black italic uppercase">No workouts logged yet</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-40">Time to hit the iron!</p>
            </div>
          </div>
        ) : (
          history.map((session: CompletedWorkout) => (
            <Card key={session.id} className="border-none bg-muted/30 hover:bg-muted transition-all active:scale-[0.98] cursor-pointer overflow-hidden border border-border/10">
              <CardHeader className="flex flex-row items-center justify-between py-6 space-y-0 relative">
                <div className="flex flex-col gap-1 relative z-10">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">{session.planName}</span>
                  <CardTitle className="text-2xl font-black italic tracking-tighter">{format(session.startTime, 'MMM d, yyyy')}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-widest">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(session.startTime, 'HH:mm')} — {format(session.endTime, 'HH:mm')}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1 relative z-10">
                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1">
                       <Zap className="h-2 w-2 fill-current" />
                       Done
                    </div>
                </div>
                {/* Background Decor */}
                <Weight className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.03] rotate-12" />
              </CardHeader>
              <CardContent className="pb-6">
                 <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-6">
                      <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Intensity</span>
                          <span className="flex items-center gap-1 font-black italic text-xl text-accent-amber">
                              <TrendingUp className="h-4 w-4" />
                              {session.totalSets} <span className="text-[10px] uppercase ml-1 opacity-40">Sets</span>
                          </span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Scope</span>
                          <span className="font-black italic text-xl">
                              {session.totalExercises} <span className="text-[10px] uppercase ml-1 opacity-40">Groups</span>
                          </span>
                      </div>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
