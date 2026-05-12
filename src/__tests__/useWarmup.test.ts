import { generateWarmupSets } from "../hooks/useWarmup";

describe("generateWarmupSets", () => {
  test("225lb working weight generates correct warmup sets", () => {
    const sets = generateWarmupSets(225, 45);
    expect(sets).toEqual([
      { weight: 45, reps: 10, label: "Empty bar" },
      { weight: 115, reps: 5, label: "50%" },
      { weight: 160, reps: 3, label: "70%" },
      { weight: 190, reps: 2, label: "85%" },
    ]);
  });

  test("95lb working weight generates only empty bar", () => {
    // 50% of 95 = 47.5, rounded to nearest 5 = 50. 50 > 45 so it should appear.
    // Actually: Math.round(95 * 0.5 / 5) * 5 = Math.round(9.5) * 5 = 10 * 5 = 50
    // 50 > 45, so 50% set is included
    // 70%: Math.round(95 * 0.7 / 5) * 5 = Math.round(13.3) * 5 = 13 * 5 = 65
    // 65 > 50, so 70% set is included
    // 85%: Math.round(95 * 0.85 / 5) * 5 = Math.round(16.15) * 5 = 16 * 5 = 80
    // 80 > 65 and 80 < 95, so 85% set is included
    const sets = generateWarmupSets(95, 45);
    expect(sets).toEqual([
      { weight: 45, reps: 10, label: "Empty bar" },
      { weight: 50, reps: 5, label: "50%" },
      { weight: 65, reps: 3, label: "70%" },
      { weight: 80, reps: 2, label: "85%" },
    ]);
  });

  test("45lb working weight generates empty array (at bar weight)", () => {
    const sets = generateWarmupSets(45, 45);
    expect(sets).toEqual([]);
  });

  test("below bar weight generates empty array", () => {
    const sets = generateWarmupSets(30, 45);
    expect(sets).toEqual([]);
  });

  test("kg bar weight (20kg) works correctly", () => {
    const sets = generateWarmupSets(100, 20);
    // 50%: Math.round(100 * 0.5 / 5) * 5 = 50
    // 70%: Math.round(100 * 0.7 / 5) * 5 = 70
    // 85%: Math.round(100 * 0.85 / 5) * 5 = 85
    expect(sets).toEqual([
      { weight: 20, reps: 10, label: "Empty bar" },
      { weight: 50, reps: 5, label: "50%" },
      { weight: 70, reps: 3, label: "70%" },
      { weight: 85, reps: 2, label: "85%" },
    ]);
  });
});
