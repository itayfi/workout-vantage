import * as React from 'react';
import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, LayoutDashboard, Calendar, Play, Clock, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <span>Workout Vantage</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink to="/plans" icon={Calendar}>
              Plans
            </NavLink>
            <NavLink to="/history" icon={Clock}>
              History
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : theme === 'light' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                  <span className="sr-only">Theme preference</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/session">
              <Button className="font-semibold shadow-lg shadow-primary/20">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Start
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto flex-1 overflow-x-hidden px-4 py-8">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="pb-safe fixed right-0 -bottom-px left-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-lg md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-6">
          <MobileNavLink to="/" icon={LayoutDashboard} label="Home" />
          <MobileNavLink to="/plans" icon={Calendar} label="Plans" />
          <MobileNavLink to="/session" icon={Play} label="Start" />
          <MobileNavLink to="/history" icon={Clock} label="History" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ to, icon: Icon, children }: { to: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: 'text-primary' }}
      inactiveProps={{ className: 'text-muted-foreground hover:text-foreground' }}
      className="flex items-center gap-2 text-sm font-medium transition-colors"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function MobileNavLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 text-muted-foreground transition-colors [&.active]:text-primary"
    >
      <div className="flex h-5 w-5 items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[10px] leading-none font-medium">{label}</span>
    </Link>
  );
}
