import { estimateOneRepMax, getBest1RM } from "../hooks/useOneRepMax";
import { WorkoutLog } from "../types";

describe("estimateOneRepMax", () => {
  test("100lb x 10 reps = 133", () => {
    expect(estimateOneRepMax(100, 10)).toBe(133);
  });

  test("200lb x 1 rep = 200", () => {
    expect(estimateOneRepMax(200, 1)).toBe(200);
  });

  test("0 weight returns 0", () => {
    expect(estimateOneRepMax(0, 10)).toBe(0);
  });

  test("0 reps returns 0", () => {
    expect(estimateOneRepMax(100, 0)).toBe(0);
  });

  test("negative reps returns 0", () => {
    expect(estimateOneRepMax(100, -1)).toBe(0);
  });

  test("negative weight returns 0", () => {
    expect(estimateOneRepMax(-50, 5)).toBe(0);
  });
});

describe("getBest1RM", () => {
  const history: WorkoutLog[] = [
    {
      id: "1",
      date: "2025-01-01",
      day: 1,
      week: 1,
      cycle: 1,
      completedAt: "2025-01-01T12:00:00Z",
      exercises: [
        {
          name: "Bench",
          key: "bench_4",
          reps: 4,
          type: "red",
          sets: [
            { weight: 185, reps: 4, isAmrap: false, isPr: false },
            { weight: 185, reps: 4, isAmrap: false, isPr: false },
          ],
        },
      ],
    },
    {
      id: "2",
      date: "2025-01-08",
      day: 2,
      week: 2,
      cycle: 1,
      completedAt: "2025-01-08T12:00:00Z",
      exercises: [
        {
          name: "Bench",
          key: "bench_4",
          reps: 4,
          type: "red",
          sets: [
            { weight: 200, reps: 3, isAmrap: false, isPr: false },
            { weight: 190, reps: 5, isAmrap: false, isPr: false },
          ],
        },
        {
          name: "Squat",
          key: "squat_4",
          reps: 4,
          type: "blue",
          sets: [
            { weight: 225, reps: 4, isAmrap: false, isPr: false },
          ],
        },
      ],
    },
  ];

  test("finds highest estimate across all workouts for bench_4", () => {
    // 185 x 4 = 185 * (1 + 4/30) = 185 * 1.133 = 210 (rounded)
    // 200 x 3 = 200 * (1 + 3/30) = 200 * 1.1 = 220
    // 190 x 5 = 190 * (1 + 5/30) = 190 * 1.167 = 222 (rounded)
    expect(getBest1RM(history, "bench_4")).toBe(222);
  });

  test("returns 0 for exercise not in history", () => {
    expect(getBest1RM(history, "ohp_4")).toBe(0);
  });

  test("returns 0 for empty history", () => {
    expect(getBest1RM([], "bench_4")).toBe(0);
  });

  test("finds correct value for squat_4", () => {
    // 225 x 4 = 225 * (1 + 4/30) = 225 * 1.133 = 255 (rounded)
    expect(getBest1RM(history, "squat_4")).toBe(255);
  });
});
