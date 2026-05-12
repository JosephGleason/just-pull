import { advanceCycleState, resetPrsForNewCycle, createInitialCycleState } from "../hooks/useCycleState";
import { CycleState, ExerciseWeight } from "../types";

describe("advanceCycleState", () => {
  test("advances day within same week", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 1, nextDay: 1, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(2);
    expect(next.weekNumber).toBe(1);
    expect(next.cycleNumber).toBe(1);
  });

  test("advances from day 3 to day 5 (skips 4)", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 1, nextDay: 3, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(5);
  });

  test("wraps from day 6 to day 1 of next week", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 1, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(1);
    expect(next.weekNumber).toBe(2);
    expect(next.cycleNumber).toBe(1);
  });

  test("wraps from week 3 day 6 to new cycle", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 3, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(1);
    expect(next.weekNumber).toBe(1);
    expect(next.cycleNumber).toBe(2);
    expect(next.isDeload).toBe(false);
  });

  test("cycle 5 wraps to cycle 6 which is deload", () => {
    const state: CycleState = { cycleNumber: 5, weekNumber: 3, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.cycleNumber).toBe(6);
    expect(next.isDeload).toBe(true);
  });

  test("cycle 11 wraps to cycle 12 which is deload", () => {
    const state: CycleState = { cycleNumber: 11, weekNumber: 3, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.cycleNumber).toBe(12);
    expect(next.isDeload).toBe(true);
  });
});

describe("resetPrsForNewCycle", () => {
  test("cycle 1 sets pr to null", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: null, prStatus: null },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 1);
    expect(result.bench_4.pr).toBeNull();
    expect(result.bench_4.prStatus).toBeNull();
  });

  test("cycle 2+ sets pr to working + increment", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: null, prStatus: null },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 2);
    expect(result.bench_4.pr).toBe(140);
    expect(result.bench_4.prStatus).toBe("pending");
  });

  test("succeeded PR becomes new working weight", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: 140, prStatus: "succeeded" },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 3);
    expect(result.bench_4.working).toBe(140);
    expect(result.bench_4.pr).toBe(145);
    expect(result.bench_4.prStatus).toBe("pending");
  });

  test("failed PR keeps working weight", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: 140, prStatus: "failed" },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 3);
    expect(result.bench_4.working).toBe(135);
    expect(result.bench_4.pr).toBe(140);
    expect(result.bench_4.prStatus).toBe("pending");
  });

  test("defaults to 5lb increment when not configured", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: null, prStatus: null },
    };
    const result = resetPrsForNewCycle(weights, {}, 2);
    expect(result.bench_4.pr).toBe(140);
  });
});
