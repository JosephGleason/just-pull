import { ProgramDay, ProgramExercise, TrainingDay, WeekNumber } from "./types";

const e = (
  name: string,
  key: string,
  reps: number,
  type: "red" | "blue" | "black",
  sets: [number, number, number]
): ProgramExercise => ({ name, key, reps, type, sets });

export const PROGRAM: ProgramDay[] = [
  {
    day: 1,
    exercises: [
      e("Deadlift", "deadlift_4", 4, "blue", [2, 1, 0]),
      e("Chinups", "chinups_8", 8, "red", [3, 2, 1]),
      e("BB Rows", "bb_rows_4", 4, "red", [3, 2, 1]),
      e("Curls", "curls_12", 12, "black", [3, 2, 1]),
    ],
  },
  {
    day: 2,
    exercises: [
      e("Bench", "bench_4", 4, "red", [3, 2, 1]),
      e("Incline Press", "incline_press_8", 8, "red", [3, 2, 1]),
      e("Flies", "flies_12", 12, "black", [3, 2, 1]),
      e("Tricep Ext", "tricep_ext_12", 12, "black", [3, 2, 1]),
    ],
  },
  {
    day: 3,
    exercises: [
      e("Squat", "squat_4", 4, "blue", [2, 1, 0]),
      e("OHP", "ohp_8", 8, "red", [3, 2, 1]),
      e("Calf Raise", "calf_raise_12", 12, "black", [3, 2, 1]),
      e("Rear Delt Fly", "rear_delt_fly_12", 12, "black", [3, 2, 1]),
      e("Lat Raise", "lat_raise_12", 12, "black", [3, 2, 1]),
    ],
  },
  {
    day: 5,
    exercises: [
      e("Chinups", "chinups_4", 4, "red", [3, 2, 1]),
      e("Bench", "bench_8", 8, "red", [3, 2, 1]),
      e("BB Rows", "bb_rows_8", 8, "red", [3, 2, 1]),
      e("Incline Press", "incline_press_4", 4, "red", [3, 2, 1]),
    ],
  },
  {
    day: 6,
    exercises: [
      e("Squat", "squat_8", 8, "blue", [2, 1, 0]),
      e("OHP", "ohp_4", 4, "red", [3, 2, 1]),
      e("Calf Raise", "calf_raise_12", 12, "black", [3, 2, 1]),
      e("Curls", "curls_12", 12, "black", [3, 2, 1]),
    ],
  },
];

export const DAY_SEQUENCE: TrainingDay[] = [1, 2, 3, 5, 6];

export const ALL_EXERCISE_KEYS = [
  "deadlift_4",
  "chinups_8",
  "chinups_4",
  "bb_rows_4",
  "bb_rows_8",
  "curls_12",
  "bench_4",
  "bench_8",
  "incline_press_4",
  "incline_press_8",
  "flies_12",
  "tricep_ext_12",
  "squat_4",
  "squat_8",
  "ohp_4",
  "ohp_8",
  "calf_raise_12",
  "rear_delt_fly_12",
  "lat_raise_12",
] as const;

export const COMPOUND_KEYS = ALL_EXERCISE_KEYS.filter(
  (k) => !k.endsWith("_12")
);

export function getProgramDay(day: TrainingDay): ProgramDay {
  const found = PROGRAM.find((d) => d.day === day);
  if (!found) {
    return PROGRAM[0];
  }
  return found;
}

export function getSetsForWeek(
  exercise: ProgramExercise,
  week: WeekNumber,
  is_deload: boolean
): number {
  const base = exercise.sets[week - 1];
  const adjusted = is_deload ? Math.max(0, base - 2) : base;
  return Math.max(0, adjusted);
}
