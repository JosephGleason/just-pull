import { advanceCycleState, resetPrsForNewCycle, createInitialCycleState } from "../hooks/useCycleState";
import { CycleStateInput, ExerciseWeightInput } from "../types";

describe("advanceCycleState", () => {
  test("advances day within same week", () => {
    const state: CycleStateInput = { cycle_number: 1, week_number: 1, next_day: 1, is_deload: false };
    const next = advanceCycleState(state);
    expect(next.next_day).toBe(2);
    expect(next.week_number).toBe(1);
    expect(next.cycle_number).toBe(1);
  });

  test("advances from day 3 to day 5 (skips 4)", () => {
    const state: CycleStateInput = { cycle_number: 1, week_number: 1, next_day: 3, is_deload: false };
    const next = advanceCycleState(state);
    expect(next.next_day).toBe(5);
  });

  test("wraps from day 6 to day 1 of next week", () => {
    const state: CycleStateInput = { cycle_number: 1, week_number: 1, next_day: 6, is_deload: false };
    const next = advanceCycleState(state);
    expect(next.next_day).toBe(1);
    expect(next.week_number).toBe(2);
    expect(next.cycle_number).toBe(1);
  });

  test("wraps from week 3 day 6 to new cycle", () => {
    const state: CycleStateInput = { cycle_number: 1, week_number: 3, next_day: 6, is_deload: false };
    const next = advanceCycleState(state);
    expect(next.next_day).toBe(1);
    expect(next.week_number).toBe(1);
    expect(next.cycle_number).toBe(2);
    expect(next.is_deload).toBe(false);
  });

  test("cycle 5 wraps to cycle 6 which is deload", () => {
    const state: CycleStateInput = { cycle_number: 5, week_number: 3, next_day: 6, is_deload: false };
    const next = advanceCycleState(state);
    expect(next.cycle_number).toBe(6);
    expect(next.is_deload).toBe(true);
  });

  test("cycle 11 wraps to cycle 12 which is deload", () => {
    const state: CycleStateInput = { cycle_number: 11, week_number: 3, next_day: 6, is_deload: false };
    const next = advanceCycleState(state);
    expect(next.cycle_number).toBe(12);
    expect(next.is_deload).toBe(true);
  });
});

describe("resetPrsForNewCycle", () => {
  test("cycle 1 sets pr to null", () => {
    const weights: Record<string, ExerciseWeightInput> = {
      bench_4: { exercise_key: "bench_4", working: 135, pr: null, pr_status: null },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: { increment: 5 } }, 1);
    expect(result.bench_4.pr).toBeNull();
    expect(result.bench_4.pr_status).toBeNull();
  });

  test("cycle 2+ sets pr to working + increment", () => {
    const weights: Record<string, ExerciseWeightInput> = {
      bench_4: { exercise_key: "bench_4", working: 135, pr: null, pr_status: null },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: { increment: 5 } }, 2);
    expect(result.bench_4.pr).toBe(140);
    expect(result.bench_4.pr_status).toBe("pending");
  });

  test("succeeded PR becomes new working weight", () => {
    const weights: Record<string, ExerciseWeightInput> = {
      bench_4: { exercise_key: "bench_4", working: 135, pr: 140, pr_status: "succeeded" },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: { increment: 5 } }, 3);
    expect(result.bench_4.working).toBe(140);
    expect(result.bench_4.pr).toBe(145);
    expect(result.bench_4.pr_status).toBe("pending");
  });

  test("failed PR keeps working weight", () => {
    const weights: Record<string, ExerciseWeightInput> = {
      bench_4: { exercise_key: "bench_4", working: 135, pr: 140, pr_status: "failed" },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: { increment: 5 } }, 3);
    expect(result.bench_4.working).toBe(135);
    expect(result.bench_4.pr).toBe(140);
    expect(result.bench_4.pr_status).toBe("pending");
  });

  test("defaults to 5lb increment when not configured", () => {
    const weights: Record<string, ExerciseWeightInput> = {
      bench_4: { exercise_key: "bench_4", working: 135, pr: null, pr_status: null },
    };
    const result = resetPrsForNewCycle(weights, {}, 2);
    expect(result.bench_4.pr).toBe(140);
  });
});
