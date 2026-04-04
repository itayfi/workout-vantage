import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useHistoryStore } from '@/stores/workout-history-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryView,
});

function HistoryView() {
  const { sessions } = useHistoryStore();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-5 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Workout History</h1>
          <p className="text-muted-foreground">Track your progress over time</p>
        </div>
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-12 text-center bg-muted/20">
            <History className="h-12 w-12 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No sessions yet. Time to hit the gym!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="hover:bg-accent/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between py-4 space-y-0">
                <div className="flex flex-col">
                  <CardTitle className="text-lg">{session.planName}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(session.startTime, 'MMM d, yyyy • HH:mm')}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-primary font-black text-sm uppercase tracking-wide">Completed</div>
                   <div className="text-[10px] text-muted-foreground italic">
                     {session.endTime ? format(session.endTime, 'HH:mm') : '--:--'}
                   </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                 <div className="grid grid-cols-2 gap-4 border-t pt-4">
                     <div className="flex flex-col">
                         <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Volume</span>
                         <span className="flex items-center gap-1 font-black">
                             <TrendingUp className="h-3 w-3 text-secondary" />
                             8,420kg
                         </span>
                     </div>
                     <div className="flex flex-col">
                         <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Exercises</span>
                         <span className="font-black">{session.exercises.length} Slots</span>
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
