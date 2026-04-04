Create a Vite + React PWA named "Workout Vantage" using Tailwind CSS, Shadcn/UI, and TanStack Router. The app runs on GitHub Pages with no backend; all data persists in Local Storage using Zustand with separate stores.
Use the frontend-design skill to create a distinctive, production-grade frontend interface. Colors were already chosen by the user - use the selected colors in the shadcn configured theme.

**1. State Management (Zustand + Persist):**

- **Plan Store (`workout-plans-storage`):** \* Manages multiple workout templates.
  - Each plan contains muscle group "slots."
  - Handles the global weights map. Toggling a "sync" command updates weights across machines associated with the same muscle group.
- **History Store (`workout-history-storage`):** \* Appends completed sessions.
  - Tracks exercise ID, sets completed, reps, weight used, and date.

**2. Planning UI:**

- Allow adding/editing plans. Plans contain sorted muscle groups.
- Instead of rigid exercises, allow assigning 2-3 alternative exercises (with machine/equipment types and video links) to a muscle slot.
- Include settings for regular sets vs. supersets (grouping two exercises together).

**3. Session UI (Adaptive Gym Flow):**

- When starting a plan, instead of a static checklist, show the first planned muscle group slot.
- The user taps which of the pre-planned exercises they are engaging with based on gym floor availability.
- A set counter increments weight suggestions if actual reps surpass the target.
- An automated, highly visible countdown rest timer triggered by completing a set. Use shadcn's `Progress` component for the timer.

**4. History UI:**

- A list view showing past sessions, total volume lifted, and a "Repeat this Workout" shortcut.

**5. Stack Specifics:**

- Implement both light and dark modes natively via Shadcn styling, allow user to toggle between the two, or follow system preference.
- Fetch all requested UI components (like `Progress`, `Drawer`, `Card`) strictly through the Shadcn CLI.
- Routings configured via TanStack Router.
