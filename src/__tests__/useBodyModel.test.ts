import { computeMuscleStates } from "../hooks/useBodyModel";
import { WorkoutLogRow, BodyLogRow } from "../types";

function makeWorkout(
  date: string,
  exercises: { key: string; sets: number }[]
): WorkoutLogRow {
  return {
    id: date,
    user_id: "test-user",
    created_at: date + "T12:00:00Z",
    updated_at: date + "T12:00:00Z",
    date,
    day: 1,
    week: 1,
    cycle: 1,
    exercises: exercises.map((e) => ({
      name: e.key,
      key: e.key,
      reps: 4,
      type: "red" as const,
      sets: Array.from({ length: e.sets }, () => ({
        weight: 100,
        reps: 4,
        is_amrap: false,
        is_pr: false,
      })),
    })),
    completed_at: date + "T12:00:00Z",
  };
}

function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function makeBodyLog(date: string, weight: number, body_fat_percent: number): BodyLogRow {
  return {
    id: date,
    user_id: "test-user",
    created_at: date + "T00:00:00Z",
    updated_at: date + "T00:00:00Z",
    date,
    weight,
    body_fat_percent,
  };
}

describe("computeMuscleStates", () => {
  test("returns all zeroes with no history", () => {
    const result = computeMuscleStates({}, {}, new Date("2025-01-01"));
    expect(result.muscles.chest).toBe(0);
    expect(result.muscles.back).toBe(0);
    expect(result.muscles.quads).toBe(0);
    expect(result.months_trained).toBe(0);
    expect(result.body_fat_percent).toBe(0);
  });

  test("training bench increases chest, shoulders, triceps but NOT quads", () => {
    const workouts = [makeWorkout("2025-01-06", [{ key: "bench_4", sets: 5 }])];
    const result = computeMuscleStates(toRecord(workouts), {}, new Date("2025-01-06"));
    expect(result.muscles.chest).toBeGreaterThan(0);
    expect(result.muscles.shoulders).toBeGreaterThan(0);
    expect(result.muscles.triceps).toBeGreaterThan(0);
    expect(result.muscles.quads).toBe(0);
  });

  test("muscles decay after 3 weeks of inactivity", () => {
    const workouts = [
      makeWorkout("2025-01-06", [{ key: "bench_4", sets: 5 }]),
      makeWorkout("2025-01-08", [{ key: "bench_4", sets: 5 }]),
      makeWorkout("2025-01-10", [{ key: "bench_4", sets: 5 }]),
    ];

    // Value right after training
    const postTraining = computeMuscleStates(
      toRecord(workouts),
      {},
      new Date("2025-01-10")
    );

    // Value 3 weeks later
    const afterDecay = computeMuscleStates(
      toRecord(workouts),
      {},
      new Date("2025-01-31")
    );

    // Chest should have decayed to less than 60% of post-training value
    expect(afterDecay.muscles.chest).toBeLessThan(
      postTraining.muscles.chest * 0.6
    );
    expect(afterDecay.muscles.chest).toBeGreaterThan(0);
  });

  test("muscle memory: regaining is faster than fresh gains", () => {
    // Build up chest over 10 sessions (weeks 1-5, ~2 per week)
    const buildUpWorkouts: WorkoutLogRow[] = [];
    const startDate = new Date("2025-01-06");
    for (let i = 0; i < 10; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i * 3); // every 3 days
      const date = d.toISOString().slice(0, 10);
      buildUpWorkouts.push(makeWorkout(date, [{ key: "bench_4", sets: 5 }]));
    }

    // Let it decay for 2 months (no training Feb-Mar)
    // Then retrain 3 sessions in April
    const retrainWorkouts = [
      ...buildUpWorkouts,
      makeWorkout("2025-04-01", [{ key: "bench_4", sets: 5 }]),
      makeWorkout("2025-04-04", [{ key: "bench_4", sets: 5 }]),
      makeWorkout("2025-04-07", [{ key: "bench_4", sets: 5 }]),
    ];

    const afterRetrain = computeMuscleStates(
      toRecord(retrainWorkouts),
      {},
      new Date("2025-04-07")
    );

    // Fresh 3 sessions only (no prior history)
    const freshWorkouts = [
      makeWorkout("2025-04-01", [{ key: "bench_4", sets: 5 }]),
      makeWorkout("2025-04-04", [{ key: "bench_4", sets: 5 }]),
      makeWorkout("2025-04-07", [{ key: "bench_4", sets: 5 }]),
    ];

    const freshGain = computeMuscleStates(
      toRecord(freshWorkouts),
      {},
      new Date("2025-04-07")
    );

    // Regaining with muscle memory should produce a larger chest value
    expect(afterRetrain.muscles.chest).toBeGreaterThan(
      freshGain.muscles.chest
    );
  });

  test("body fat interpolates between two logs", () => {
    const bodyLog: BodyLogRow[] = [
      makeBodyLog("2025-01-01", 200, 20),
      makeBodyLog("2025-02-01", 190, 18),
    ];

    // Midpoint: Jan 16
    const result = computeMuscleStates({}, toRecord(bodyLog), new Date("2025-01-16"));
    // ~halfway -> ~19% (within tolerance of interpolation)
    expect(result.body_fat_percent).toBeGreaterThan(18.5);
    expect(result.body_fat_percent).toBeLessThan(19.5);
  });

  test("body fat drifts upward when inactive and no recent log", () => {
    // Historical high BF of 25% allows drift room above the recent 20%
    const bodyLog: BodyLogRow[] = [
      makeBodyLog("2024-06-01", 210, 25),
      makeBodyLog("2025-01-01", 200, 20),
    ];

    // 3 months later with NO training
    const result = computeMuscleStates({}, toRecord(bodyLog), new Date("2025-04-01"));
    // BF should have drifted up from 20% (capped at max recorded 25%)
    expect(result.body_fat_percent).toBeGreaterThan(20);
    expect(result.body_fat_percent).toBeLessThanOrEqual(25);
  });

  test("body fat does NOT drift when training is consistent", () => {
    const bodyLog: BodyLogRow[] = [
      makeBodyLog("2025-01-01", 200, 20),
    ];

    // Consistent training: 3+ sessions per week for the last 28 days
    const workouts: WorkoutLogRow[] = [];
    // Generate workouts every 2 days for Jan through March
    for (let d = 1; d <= 90; d += 2) {
      const date = new Date("2025-01-01");
      date.setUTCDate(date.getUTCDate() + d);
      const dateStr = date.toISOString().slice(0, 10);
      workouts.push(makeWorkout(dateStr, [{ key: "bench_4", sets: 3 }]));
    }

    const result = computeMuscleStates(
      toRecord(workouts),
      toRecord(bodyLog),
      new Date("2025-04-01")
    );
    // BF should NOT have drifted -- should still be 20%
    expect(result.body_fat_percent).toBe(20);
  });

  test("months trained counts correctly", () => {
    const workouts = [
      makeWorkout("2025-01-15", [{ key: "bench_4", sets: 3 }]),
    ];

    // Jan 15 to Apr 15 = 90 days -> floor(90/30) = 3 months
    const result = computeMuscleStates(
      toRecord(workouts),
      {},
      new Date("2025-04-15")
    );
    expect(result.months_trained).toBe(3);
  });

  test("values are clamped to [0, 1] even with massive volume", () => {
    // Single workout with enormous volume
    const workouts = [
      makeWorkout("2025-01-06", [
        { key: "bench_4", sets: 100 },
        { key: "bench_8", sets: 100 },
        { key: "flies_12", sets: 100 },
        { key: "incline_press_4", sets: 100 },
      ]),
    ];

    const result = computeMuscleStates(toRecord(workouts), {}, new Date("2025-01-06"));
    expect(result.muscles.chest).toBeLessThanOrEqual(1);
    expect(result.muscles.chest).toBeGreaterThanOrEqual(0);
    expect(result.muscles.shoulders).toBeLessThanOrEqual(1);
    expect(result.muscles.triceps).toBeLessThanOrEqual(1);
  });
});
