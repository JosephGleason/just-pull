import { calculateNutrition } from "../hooks/useNutrition";
import { NutritionInput } from "../types";

const baseSettings: NutritionInput = {
  age: 25,
  weight: 180,
  height: 70,
  sex: "male",
  activity_level: "moderate",
  goal: "maintain",
};

describe("calculateNutrition", () => {
  test("returns whole numbers for all fields", () => {
    const result = calculateNutrition(baseSettings, "lb");
    expect(Number.isInteger(result.calories)).toBe(true);
    expect(Number.isInteger(result.protein)).toBe(true);
    expect(Number.isInteger(result.fat)).toBe(true);
    expect(Number.isInteger(result.carbs)).toBe(true);
  });

  test("protein equals body weight in lbs", () => {
    const result = calculateNutrition(baseSettings, "lb");
    expect(result.protein).toBe(180);
  });

  test("protein in kg mode uses 2.2 conversion", () => {
    const kgSettings: NutritionInput = {
      ...baseSettings,
      weight: 82,
      height: 178,
    };
    const result = calculateNutrition(kgSettings, "kg");
    expect(result.protein).toBe(Math.round(82 * 2.20462));
  });

  test("bulk adds ~400 calories vs maintain", () => {
    const maintain = calculateNutrition(baseSettings, "lb");
    const bulk = calculateNutrition({ ...baseSettings, goal: "bulk" }, "lb");
    expect(bulk.calories - maintain.calories).toBe(400);
  });

  test("cut subtracts ~400 calories vs maintain", () => {
    const maintain = calculateNutrition(baseSettings, "lb");
    const cut = calculateNutrition({ ...baseSettings, goal: "cut" }, "lb");
    expect(maintain.calories - cut.calories).toBe(400);
  });

  test("female BMR is lower than male for same stats", () => {
    const male = calculateNutrition(baseSettings, "lb");
    const female = calculateNutrition({ ...baseSettings, sex: "female" }, "lb");
    expect(female.calories).toBeLessThan(male.calories);
  });
});
