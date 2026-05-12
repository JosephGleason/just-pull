export const MUSCLE_GROUPS = [
  "chest",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "back",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const FRONT_MUSCLES: MuscleGroup[] = [
  "chest",
  "shoulders",
  "biceps",
  "quads",
  "calves",
];

export const BACK_MUSCLES: MuscleGroup[] = [
  "back",
  "triceps",
  "forearms",
  "glutes",
  "hamstrings",
];

export const EXERCISE_MUSCLE_MAP: Record<string, Partial<Record<MuscleGroup, number>>> = {
  deadlift_4: { back: 0.4, glutes: 0.3, hamstrings: 0.2, forearms: 0.1 },
  squat_4: { quads: 0.4, glutes: 0.3, hamstrings: 0.2, calves: 0.1 },
  squat_8: { quads: 0.4, glutes: 0.3, hamstrings: 0.2, calves: 0.1 },
  bench_4: { chest: 0.5, shoulders: 0.3, triceps: 0.2 },
  bench_8: { chest: 0.5, shoulders: 0.3, triceps: 0.2 },
  ohp_4: { shoulders: 0.5, triceps: 0.3, chest: 0.2 },
  ohp_8: { shoulders: 0.5, triceps: 0.3, chest: 0.2 },
  chinups_4: { back: 0.5, biceps: 0.4, forearms: 0.1 },
  chinups_8: { back: 0.5, biceps: 0.4, forearms: 0.1 },
  bb_rows_4: { back: 0.4, biceps: 0.3, forearms: 0.2, shoulders: 0.1 },
  bb_rows_8: { back: 0.4, biceps: 0.3, forearms: 0.2, shoulders: 0.1 },
  incline_press_4: { chest: 0.4, shoulders: 0.4, triceps: 0.2 },
  incline_press_8: { chest: 0.4, shoulders: 0.4, triceps: 0.2 },
  curls_12: { biceps: 0.8, forearms: 0.2 },
  flies_12: { chest: 0.9, shoulders: 0.1 },
  tricep_ext_12: { triceps: 0.9, chest: 0.1 },
  calf_raise_12: { calves: 1.0 },
  rear_delt_fly_12: { shoulders: 0.6, back: 0.4 },
  lat_raise_12: { shoulders: 1.0 },
};

export const DECAY_HALF_LIFE_DAYS = 21;
export const MAX_WEEKLY_GAIN = 0.05;
export const MEMORY_MULTIPLIER = 2.0;
export const BF_DRIFT_PER_MONTH = 0.5;
export const INACTIVE_THRESHOLD_SESSIONS_PER_WEEK = 2;
