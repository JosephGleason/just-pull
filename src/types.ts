export type ExerciseType = "red" | "blue" | "black";
export type Units = "lb" | "kg";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "bulk" | "cut" | "maintain";
export type PrStatus = "pending" | "succeeded" | "failed";
export type TrainingDay = 1 | 2 | 3 | 5 | 6;
export type WeekNumber = 1 | 2 | 3;

export interface ProgramExercise {
  name: string;
  key: string;
  reps: number;
  type: ExerciseType;
  sets: [number, number, number];
}

export interface ProgramDay {
  day: TrainingDay;
  exercises: ProgramExercise[];
}

export interface Settings {
  restTimerCompound: number;
  restTimerAccessory: number;
  units: Units;
  increments: Record<string, number>;
  nutrition: NutritionSettings | null;
}

export interface NutritionSettings {
  age: number;
  weight: number;
  height: number;
  sex: "male" | "female";
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface CycleState {
  cycleNumber: number;
  weekNumber: WeekNumber;
  nextDay: TrainingDay;
  isDeload: boolean;
}

export interface ExerciseWeight {
  working: number;
  pr: number | null;
  prStatus: PrStatus | null;
}

export interface SetLog {
  weight: number;
  reps: number;
  isAmrap: boolean;
  isPr: boolean;
}

export interface ExerciseLog {
  name: string;
  key: string;
  reps: number;
  type: ExerciseType;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  day: TrainingDay;
  week: WeekNumber;
  cycle: number;
  exercises: ExerciseLog[];
  completedAt: string | null;
}

export interface CurrentSession {
  startedAt: string;
  day: TrainingDay;
  week: WeekNumber;
  cycle: number;
  exercises: ExerciseLog[];
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
