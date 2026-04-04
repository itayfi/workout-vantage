import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// Root layout and routes
import { Route as rootRoute } from './routes/__root';
import { Route as indexRoute } from './routes/index';
import { Route as plansRoute } from './routes/plans';
import { Route as planEditRoute } from './routes/plans.$planId';
import { Route as sessionRoute } from './routes/session';
import { Route as historyRoute } from './routes/history';

import './index.css';
import { ThemeProvider } from '@/components/theme-provider';

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  plansRoute,
  planEditRoute,
  sessionRoute,
  historyRoute,
]);

// Create the router instance
const router = createRouter({ 
  routeTree,
  basepath: '/workout-vantage/',
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vantage-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>,
  );
}
