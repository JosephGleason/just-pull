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

export interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface BodyModelState {
  muscles: Record<string, number>;
  body_fat_percent: number;
  body_weight: number;
  months_trained: number;
  peak_muscles: Record<string, number>;
}

export interface DbRow {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface OwnedDbRow extends DbRow {
  user_id: string;
}

export interface ProfileInput {
  units: Units;
  rest_timer_compound: number;
  rest_timer_accessory: number;
  onboarding_complete: boolean;
}
export interface ProfileRow extends ProfileInput, DbRow {}

export interface NutritionInput {
  age: number;
  weight: number;
  height: number;
  sex: "male" | "female";
  activity_level: ActivityLevel;
  goal: Goal;
}
export interface NutritionRow extends NutritionInput, DbRow {}

export interface IncrementInput {
  exercise_key: string;
  increment: number;
}
export interface IncrementRow extends IncrementInput, OwnedDbRow {}

export interface CycleStateInput {
  cycle_number: number;
  week_number: WeekNumber;
  next_day: TrainingDay;
  is_deload: boolean;
}
export interface CycleStateRow extends CycleStateInput, DbRow {}

export interface ExerciseWeightInput {
  exercise_key: string;
  working: number;
  pr: number | null;
  pr_status: PrStatus | null;
  fail_count: number;
}
export interface ExerciseWeightRow extends ExerciseWeightInput, OwnedDbRow {}

export interface SetLog {
  weight: number;
  reps: number;
  is_amrap: boolean;
  is_pr: boolean;
}

export interface ExerciseLog {
  name: string;
  key: string;
  reps: number;
  type: ExerciseType;
  sets: SetLog[];
}

export interface CurrentSessionData {
  started_at: string;
  day: TrainingDay;
  week: WeekNumber;
  cycle: number;
  exercises: ExerciseLog[];
}
export interface CurrentSessionRow extends DbRow {
  data: CurrentSessionData;
}

export interface WorkoutLogInput {
  id: string;
  date: string;
  day: TrainingDay;
  week: WeekNumber;
  cycle: number;
  exercises: ExerciseLog[];
  completed_at: string | null;
}
export interface WorkoutLogRow extends WorkoutLogInput, OwnedDbRow {}

export interface BodyLogInput {
  date: string;
  weight: number;
  body_fat_percent: number;
}
export interface BodyLogRow extends BodyLogInput, OwnedDbRow {}
