jest.mock("expo-crypto", () => ({ randomUUID: () => "test-uuid" }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("../lib/store", () => ({
  weights$: { get: jest.fn() },
  cycle_state$: { get: jest.fn() },
  current_session$: { get: jest.fn(), set: jest.fn() },
  increments$: { get: jest.fn() },
  workouts$: {},
}));
jest.mock("../lib/auth", () => ({
  auth$: { uid: { get: () => "test-uid" } },
}));

import { buildSessionExercises, getTargetWeight } from "../hooks/useWorkout";
import { CycleStateInput, ExerciseWeightInput } from "../types";

const baseCycle: CycleStateInput = { cycle_number: 2, week_number: 1, next_day: 1, is_deload: false };

const weights: Record<string, ExerciseWeightInput> = {
  deadlift_4: { exercise_key: "deadlift_4", working: 225, pr: 235, pr_status: "pending", fail_count: 0 },
  chinups_8: { exercise_key: "chinups_8", working: 0, pr: 5, pr_status: "pending", fail_count: 0 },
  bb_rows_4: { exercise_key: "bb_rows_4", working: 135, pr: 140, pr_status: "pending", fail_count: 0 },
  curls_12: { exercise_key: "curls_12", working: 30, pr: null, pr_status: null, fail_count: 0 },
};

describe("buildSessionExercises", () => {
  test("Day 1 Week 1 includes all 4 exercises", () => {
    const exercises = buildSessionExercises(baseCycle, weights);
    expect(exercises).toHaveLength(4);
    expect(exercises.map((e) => e.key)).toEqual(["deadlift_4", "chinups_8", "bb_rows_4", "curls_12"]);
  });

  test("Day 1 Week 3 excludes deadlift (0 sets)", () => {
    const cycle = { ...baseCycle, week_number: 3 as const };
    const exercises = buildSessionExercises(cycle, weights);
    expect(exercises.map((e) => e.key)).not.toContain("deadlift_4");
    expect(exercises).toHaveLength(3);
  });

  test("deload week 1 excludes deadlift (2-2=0)", () => {
    const cycle = { ...baseCycle, is_deload: true };
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
    const cycle1 = { ...baseCycle, cycle_number: 1 };
    expect(getTargetWeight("deadlift_4", weights, cycle1)).toBe(225);
  });

  test("cycle 2+ with pending PR returns PR weight", () => {
    expect(getTargetWeight("deadlift_4", weights, baseCycle)).toBe(235);
  });

  test("cycle 2+ with failed PR returns working weight", () => {
    const failedWeights = { ...weights, deadlift_4: { exercise_key: "deadlift_4", working: 225, pr: 235, pr_status: "failed" as const, fail_count: 0 } };
    expect(getTargetWeight("deadlift_4", failedWeights, baseCycle)).toBe(225);
  });

  test("black exercise returns working weight regardless", () => {
    expect(getTargetWeight("curls_12", weights, baseCycle)).toBe(30);
  });

  test("missing key returns 0", () => {
    expect(getTargetWeight("nonexistent_4", weights, baseCycle)).toBe(0);
  });
});
