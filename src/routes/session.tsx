import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { useHistoryStore } from '@/stores/workout-history-storage';
import { useWorkoutPlans } from '@/stores/workout-plans-storage';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import { Play, ChevronRight, Activity, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session',
  component: Session,
});

function Session() {
  const { activeSession, startSession, endSession } = useHistoryStore();
  const { plans } = useWorkoutPlans();
  const [restTime, setRestTime] = React.useState(0);
  const [totalRestTime, setTotalRestTime] = React.useState(60);

  // Timer logic for rest
  React.useEffect(() => {
    if (restTime > 0) {
      const timer = setInterval(() => {
        setRestTime((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [restTime]);

  const startRest = () => {
    setRestTime(60);
    setTotalRestTime(60);
  };

  if (!activeSession) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Active Session</h1>
        <p className="text-muted-foreground">Select a plan to start your workout.</p>

        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="group cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => startSession(plan.id, plan.name)}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.slots.length} target muscles</p>
                </div>
                <div className="rounded-full bg-primary/10 p-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Play className="h-6 w-6 fill-current" />
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-8 text-center bg-muted/20">
              <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">You need to create a plan before you can start a session.</p>
              <Button asChild variant="outline">
                <Link to="/plans">Manage Plans</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{activeSession.planName}</h1>
          <p className="text-primary font-medium">In Progress</p>
        </div>
        <Button variant="outline" size="sm" onClick={endSession}>
          End Session
        </Button>
      </div>

      {/* Rest Timer Overlay/Banner */}
      {restTime > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-primary italic">
                <Clock className="h-4 w-4" />
                RESTING...
              </div>
              <div className="text-xl font-black text-primary font-mono">{restTime}s</div>
            </div>
            <Progress value={(restTime / totalRestTime) * 100} className="h-2 bg-primary/20" />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <ChevronRight className="h-5 w-5 text-primary" />
            Next Muscle Group
          </h2>
          
          <Drawer>
            <DrawerTrigger asChild>
              <Card className="cursor-pointer border-2 hover:border-primary/50 transition-colors bg-card/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black">Chest (Pectorals)</h3>
                      <p className="text-muted-foreground">Tap to select your machine</p>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DrawerTrigger>
            <DrawerContent className="bg-background/95 backdrop-blur-xl border-t-2 border-primary/20">
              <DrawerHeader>
                <DrawerTitle className="text-3xl font-black text-center">Pick Your Machine</DrawerTitle>
              </DrawerHeader>
              <div className="grid gap-4 p-4 pb-12">
                <MachineOption name="Bench Press" type="Barbell" suggestedWeight={80} step={2.5} onSelect={startRest} />
                <MachineOption name="Dumbbell Press" type="Dumbbell" suggestedWeight={30} step={2} onSelect={startRest} />
                <MachineOption name="Chest Press" type="Machine" suggestedWeight={65} step={5} onSelect={startRest} />
              </div>
              <DrawerFooter className="pt-0">
                <Button variant="ghost" className="w-full">Cancel</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
      </div>
    </div>
  );
}

function MachineOption({ name, type, suggestedWeight, step, onSelect }: { name: string, type: string, suggestedWeight: number, step: number, onSelect: () => void }) {
  return (
    <Card 
      className="cursor-pointer border-none bg-accent/30 hover:bg-primary hover:text-primary-foreground transition-all duration-300 active:scale-[0.98]"
      onClick={onSelect}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-bold">{name}</span>
          <span className="text-xs opacity-70 italic">{type} • {step}kg steps</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black">{suggestedWeight}kg</span>
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Suggested</span>
        </div>
      </CardContent>
    </Card>
  );
}
