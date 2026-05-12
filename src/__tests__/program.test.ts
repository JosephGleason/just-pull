import { getProgramDay, getSetsForWeek, PROGRAM, ALL_EXERCISE_KEYS, COMPOUND_KEYS } from "../program";

describe("program definition", () => {
  test("has exactly 5 training days", () => {
    expect(PROGRAM).toHaveLength(5);
    expect(PROGRAM.map((d) => d.day)).toEqual([1, 2, 3, 5, 6]);
  });

  test("getProgramDay returns correct day", () => {
    const day1 = getProgramDay(1);
    expect(day1.exercises[0].name).toBe("Deadlift");
    expect(day1.exercises[0].key).toBe("deadlift_4");
  });

  test("blue exercises taper 2/1/0", () => {
    const day1 = getProgramDay(1);
    const deadlift = day1.exercises[0];
    expect(deadlift.type).toBe("blue");
    expect(getSetsForWeek(deadlift, 1, false)).toBe(2);
    expect(getSetsForWeek(deadlift, 2, false)).toBe(1);
    expect(getSetsForWeek(deadlift, 3, false)).toBe(0);
  });

  test("red/black exercises taper 3/2/1", () => {
    const day1 = getProgramDay(1);
    const chinups = day1.exercises[1];
    expect(chinups.type).toBe("red");
    expect(getSetsForWeek(chinups, 1, false)).toBe(3);
    expect(getSetsForWeek(chinups, 2, false)).toBe(2);
    expect(getSetsForWeek(chinups, 3, false)).toBe(1);
  });

  test("deload reduces sets by 2, clamped to 0", () => {
    const day1 = getProgramDay(1);
    const deadlift = day1.exercises[0];
    const chinups = day1.exercises[1];
    expect(getSetsForWeek(deadlift, 1, true)).toBe(0);
    expect(getSetsForWeek(chinups, 1, true)).toBe(1);
    expect(getSetsForWeek(chinups, 2, true)).toBe(0);
    expect(getSetsForWeek(chinups, 3, true)).toBe(0);
  });

  test("all canonical keys are unique", () => {
    const set = new Set(ALL_EXERCISE_KEYS);
    expect(set.size).toBe(ALL_EXERCISE_KEYS.length);
  });

  test("compound keys exclude 12-rep exercises", () => {
    expect(COMPOUND_KEYS.every((k) => !k.endsWith("_12"))).toBe(true);
  });

  test("every exercise in program has a key in ALL_EXERCISE_KEYS", () => {
    const allKeys = new Set(ALL_EXERCISE_KEYS);
    for (const day of PROGRAM) {
      for (const ex of day.exercises) {
        expect(allKeys.has(ex.key as any)).toBe(true);
      }
    }
  });
});
