export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Hips';

export type Muscle = {
  id: string;
  name: string;
  group: MuscleGroup;
};

export const MUSCLE_CATALOG: Muscle[] = [
  { id: 'upper-chest', name: 'Upper Chest', group: 'Chest' },
  { id: 'mid-chest', name: 'Mid Chest', group: 'Chest' },
  { id: 'lats', name: 'Lats', group: 'Back' },
  { id: 'upper-back', name: 'Upper Back', group: 'Back' },
  { id: 'rear-delts', name: 'Rear Delts', group: 'Shoulders' },
  { id: 'side-delts', name: 'Side Delts', group: 'Shoulders' },
  { id: 'front-delts', name: 'Front Delts', group: 'Shoulders' },
  { id: 'biceps', name: 'Biceps', group: 'Arms' },
  { id: 'triceps', name: 'Triceps', group: 'Arms' },
  { id: 'forearms', name: 'Forearms', group: 'Arms' },
  { id: 'quads', name: 'Quads', group: 'Legs' },
  { id: 'hamstrings', name: 'Hamstrings', group: 'Legs' },
  { id: 'glutes', name: 'Glutes', group: 'Hips' },
  { id: 'calves', name: 'Calves', group: 'Legs' },
  { id: 'abs', name: 'Abs', group: 'Core' },
  { id: 'obliques', name: 'Obliques', group: 'Core' },
  { id: 'lower-back', name: 'Lower Back', group: 'Back' },
];

export const MUSCLE_GROUPS = Array.from(new Set(MUSCLE_CATALOG.map((muscle) => muscle.group)));

export function getMuscleName(muscleId: string) {
  return MUSCLE_CATALOG.find((muscle) => muscle.id === muscleId)?.name ?? muscleId;
}

export function getMuscleGroup(muscleId: string) {
  return MUSCLE_CATALOG.find((muscle) => muscle.id === muscleId)?.group ?? 'Other';
}

export function getMuscleIdsFromPath(musclePath: string) {
  const normalizedPath = musclePath.toLowerCase();
  const directMatches = MUSCLE_CATALOG.filter(
    (muscle) =>
      normalizedPath.includes(muscle.id) ||
      normalizedPath.includes(muscle.name.toLowerCase()) ||
      normalizedPath.includes(muscle.group.toLowerCase()),
  ).map((muscle) => muscle.id);

  if (directMatches.length > 0) {
    return Array.from(new Set(directMatches));
  }

  return [];
}

export function formatMuscleList(muscleIds: string[]) {
  if (muscleIds.length === 0) {
    return 'Unassigned';
  }

  return muscleIds.map(getMuscleName).join(', ');
}
