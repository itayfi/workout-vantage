import { createRoute, Link } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkoutPlans } from '@/stores/workout-plans-storage';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plans',
  component: Plans,
});

function Plans() {
  const { plans } = useWorkoutPlans();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-5 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Workout Plans</h1>
          <p className="text-muted-foreground">Manage your gym routines</p>
        </div>
        <Link to="/plans/$planId" params={{ planId: 'new' }}>
          <Button size="icon" className="h-12 w-12 rounded-full shadow-lg shadow-primary/20">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No plans yet</CardTitle>
            <CardDescription className="mb-6">
              Create your first workout plan to start tracking your progress.
            </CardDescription>
            <Link to="/plans/$planId" params={{ planId: 'new' }}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Link key={plan.id} to="/plans/$planId" params={{ planId: plan.id }} className="block transition-transform active:scale-[0.98]">
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.slots.length} muscle slots</CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
