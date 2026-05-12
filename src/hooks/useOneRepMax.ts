import { WorkoutLog } from "../types";

/**
 * Epley formula: 1RM = weight * (1 + reps / 30)
 */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Find the best 1RM estimate from a workout history for a given exercise key.
 */
export function getBest1RM(history: WorkoutLog[], exerciseKey: string): number {
  let best = 0;
  for (const workout of history) {
    for (const exercise of workout.exercises) {
      if (exercise.key === exerciseKey) {
        for (const set of exercise.sets) {
          const est = estimateOneRepMax(set.weight, set.reps);
          if (est > best) best = est;
        }
      }
    }
  }
  return best;
}
