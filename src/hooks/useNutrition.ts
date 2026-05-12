import { NutritionSettings, NutritionTargets, Units } from "../types";

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_OFFSETS: Record<string, number> = {
  bulk: 400,
  cut: -400,
  maintain: 0,
};

export function calculateNutrition(
  nutrition: NutritionSettings,
  units: Units
): NutritionTargets {
  const weightKg =
    units === "kg" ? nutrition.weight : nutrition.weight * 0.453592;
  const heightCm =
    units === "kg" ? nutrition.height : nutrition.height * 2.54;

  let bmr: number;
  if (nutrition.sex === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * nutrition.age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * nutrition.age - 161;
  }

  const tdee = bmr * ACTIVITY_MULTIPLIERS[nutrition.activityLevel];
  const calories = Math.round(tdee + GOAL_OFFSETS[nutrition.goal]);

  const weightLb =
    units === "lb" ? nutrition.weight : nutrition.weight * 2.20462;
  const protein = Math.round(weightLb);

  const fat = Math.round((calories * 0.25) / 9);

  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.round((calories - proteinCals - fatCals) / 4);

  return { calories, protein, fat, carbs };
}
