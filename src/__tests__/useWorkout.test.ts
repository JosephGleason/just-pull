jest.mock("uuid", () => ({ v4: () => "test-uuid" }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("../context", () => ({
  useAppContext: jest.fn(),
}));

import { buildSessionExercises, getTargetWeight } from "../hooks/useWorkout";
import { CycleState, ExerciseWeight } from "../types";

const baseCycle: CycleState = { cycleNumber: 2, weekNumber: 1, nextDay: 1, isDeload: false };

const weights: Record<string, ExerciseWeight> = {
  deadlift_4: { working: 225, pr: 235, prStatus: "pending" },
  chinups_8: { working: 0, pr: 5, prStatus: "pending" },
  bb_rows_4: { working: 135, pr: 140, prStatus: "pending" },
  curls_12: { working: 30, pr: null, prStatus: null },
};

describe("buildSessionExercises", () => {
  test("Day 1 Week 1 includes all 4 exercises", () => {
    const exercises = buildSessionExercises(baseCycle, weights);
    expect(exercises).toHaveLength(4);
    expect(exercises.map((e) => e.key)).toEqual(["deadlift_4", "chinups_8", "bb_rows_4", "curls_12"]);
  });

  test("Day 1 Week 3 excludes deadlift (0 sets)", () => {
    const cycle = { ...baseCycle, weekNumber: 3 as const };
    const exercises = buildSessionExercises(cycle, weights);
    expect(exercises.map((e) => e.key)).not.toContain("deadlift_4");
    expect(exercises).toHaveLength(3);
  });

  test("deload week 1 excludes deadlift (2-2=0)", () => {
    const cycle = { ...baseCycle, isDeload: true };
    const exercises = buildSessionExercises(cycle, weights);
    expect(exercises.map((e) => e.key)).not.toContain("deadlift_4");
  });

  test("exercises start with empty sets array", () => {
    const exercises = buildSessionExercises(baseCycle, weights);
    for (const ex of exercises) { expect(ex.sets).toEqual([]); }
  });
});

describe("getTargetWeight", () => {
  test("cycle 1 returns working weight", () => {
    const cycle1 = { ...baseCycle, cycleNumber: 1 };
    expect(getTargetWeight("deadlift_4", weights, cycle1)).toBe(225);
  });

  test("cycle 2+ with pending PR returns PR weight", () => {
    expect(getTargetWeight("deadlift_4", weights, baseCycle)).toBe(235);
  });

  test("cycle 2+ with failed PR returns working weight", () => {
    const failedWeights = { ...weights, deadlift_4: { working: 225, pr: 235, prStatus: "failed" as const } };
    expect(getTargetWeight("deadlift_4", failedWeights, baseCycle)).toBe(225);
  });

  test("black exercise returns working weight regardless", () => {
    expect(getTargetWeight("curls_12", weights, baseCycle)).toBe(30);
  });

  test("missing key returns 0", () => {
    expect(getTargetWeight("nonexistent_4", weights, baseCycle)).toBe(0);
  });
});
