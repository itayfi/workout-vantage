Create a Vite + React PWA named "Workout Vantage" using Tailwind CSS, Shadcn/UI, and TanStack Router. The app runs on GitHub Pages with no backend; all data persists locally in the browser using Zustand with separate persisted stores.
Use the frontend-design skill to create a distinctive, production-grade frontend interface. Colors were already chosen by the user - use the selected colors in the shadcn configured theme.

**1. State Management (Zustand + Persist):**

- **Plan Store (`workout-plans-storage`):** Manages multiple workout templates.
  - Each plan contains a flat list of exercises.
  - Each exercise has a display name, equipment/machine type, optional video link, configurable weight step, target sets, target reps, adjustable rest time, and optional target weight.
  - Each exercise declares one or more "Primary Muscles" and zero or more "Secondary Muscles."
  - Muscles belong to broader muscle groups mainly for organization and user understanding, such as "Biceps" and "Triceps" belonging to "Arms."
- **History Store (`workout-history-storage`):** Appends completed sessions.
  - Tracks exercise ID, sets completed, reps, weight used, suggested weight (based on rep overloads), and date.

**2. Planning UI:**

- Allow adding/editing plans. Plans contain a flat exercise list, grouped visually by muscle group when helpful.
- Exercise editing must include equipment/machine type, video link, weight step, target sets, target reps, adjustable rest time, optional target weight, Primary Muscles, and Secondary Muscles.
- Do not model fixed muscle slots or 2-3 alternative exercises per slot. The plan should define useful exercises and muscle coverage; the session flow decides what to perform based on availability and progress.
- Do not require plan-level superset configuration initially. Supersets should primarily be created dynamically during the workout, because gym availability and fatigue change in the moment.

**3. Session UI (Adaptive Gym Flow):**

- When starting a plan, show the planned exercises with progress organized around muscles, not rigid slots.
- The workout UI should encourage doing only one exercise per Primary Muscle by default, so the user gets broad, effective coverage instead of accidentally over-focusing one muscle.
- For each muscle, encourage the user to train it as a Secondary Muscle before doing an exercise where it is a Primary Muscle. For example, if an exercise hits triceps secondarily, surface that before a triceps-primary exercise when it fits the plan.
- The user can select an available exercise based on gym floor availability. The UI should make the next best choices obvious using muscle coverage, primary/secondary fatigue, and completed-session progress.
- Superset selection should be fast and dynamic in workout mode. Recommended behavior: the user taps an exercise, optionally presses a clear "Superset" action, then selects one or more compatible exercises before starting the round. The flow should minimize clicks while the user is in the gym.
- Superset compatibility should prefer exercises that do not overload the same Primary Muscles unless the user explicitly chooses otherwise.
- A tracker UI autofills the "Suggested Weight" for that specific exercise based on previous sessions and progress logic, allowing easy (+/-) changes according to the exercise's defined "weight step".
- An automated, highly visible round countdown rest timer triggered by completing a set. The timer duration comes from the current exercise's configured rest time. Use the Shadcn chart pattern with `RadialBarChart` rather than a linear `Progress` bar.

**4. History UI:**

- A list view showing past sessions, total volume lifted, and a "Repeat this Workout" shortcut.

**5. Stack Specifics:**

- Implement both light and dark modes natively via Shadcn styling, allow user to toggle between the two, or follow system preference.
- Fetch all requested UI components (like `Drawer`, `Card`, and chart components) strictly through the Shadcn CLI where applicable.
- Routings configured via TanStack Router.
- Browser-local persistence should use a storage layer that works well for structured app data. Prefer Zustand Persist backed by IndexedDB via LocalForage for larger or evolving state; plain `localStorage` is acceptable only for tiny preferences like theme.
