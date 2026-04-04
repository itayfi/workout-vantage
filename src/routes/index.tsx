import { createRoute, Link } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Calendar, History, TrendingUp } from 'lucide-react';
import { useWorkoutPlans } from '@/stores/workout-plans-storage';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

function Dashboard() {
  const { plans } = useWorkoutPlans();

  return (
    <div className="flex animate-in flex-col gap-8 duration-500 slide-in-from-bottom-5 fade-in">
      <section className="flex flex-col gap-2">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight italic">Vantage</h1>
        <p className="text-lg text-muted-foreground">Ready to crush your goals today?</p>
      </section>

      <section className="flex flex-col gap-6">
        {/* Quick Actions - User Requested Above Stats */}
        <div className="grid grid-cols-2 gap-4">
          <ActionCard
            title="Start"
            description="Active plan"
            icon={Play}
            to="/session"
            color="bg-primary text-primary-foreground shadow-primary/20"
          />
          <ActionCard
            title="Plans"
            description={plans.length === 0 ? 'Create one' : `${plans.length} active`}
            icon={Calendar}
            to="/plans"
            color="bg-card border-2 border-border/50"
          />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Workouts" value="24" icon={History} />
          <StatCard label="Streak" value="12d" icon={TrendingUp} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-none bg-muted/30 shadow-none">
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black tracking-wider uppercase opacity-70">{label}</span>
        </div>
        <div className="text-2xl font-black">{value}</div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  to,
  color,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
  color: string;
}) {
  return (
    <Link to={to} className="group block transition-transform active:scale-95">
      <Card className={cn('relative h-full overflow-hidden border-none shadow-xl', color)}>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/20 backdrop-blur-md">
            <Icon className="h-6 w-6 fill-current" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs text-inherit opacity-70">{description}</CardDescription>
          </div>
        </CardContent>
        {/* Decorative element */}
        <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10 blur-2xl transition-colors group-hover:bg-white/20" />
      </Card>
    </Link>
  );
}
