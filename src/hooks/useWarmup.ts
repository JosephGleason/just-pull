export interface WarmupSet {
  weight: number;
  reps: number;
  label: string;
}

export function generateWarmupSets(
  workingWeight: number,
  barWeight: number
): WarmupSet[] {
  if (workingWeight <= barWeight) return [];

  const warmups: WarmupSet[] = [
    { weight: barWeight, reps: 5, label: "Empty bar" },
  ];

  const fiftyPercent = Math.round((workingWeight * 0.5) / 5) * 5;
  if (fiftyPercent > barWeight) {
    warmups.push({ weight: fiftyPercent, reps: 5, label: "50%" });
  }

  const seventyPercent = Math.round((workingWeight * 0.7) / 5) * 5;
  if (seventyPercent > fiftyPercent) {
    warmups.push({ weight: seventyPercent, reps: 3, label: "70%" });
  }

  const eightyFivePercent = Math.round((workingWeight * 0.85) / 5) * 5;
  if (eightyFivePercent > seventyPercent && eightyFivePercent < workingWeight) {
    warmups.push({ weight: eightyFivePercent, reps: 2, label: "85%" });
  }

  return warmups;
}
