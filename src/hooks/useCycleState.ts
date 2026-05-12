import { CycleState, TrainingDay, WeekNumber, ExerciseWeight } from "../types";
import { DAY_SEQUENCE, COMPOUND_KEYS } from "../program";

export function advanceCycleState(current: CycleState): CycleState {
  const dayIndex = DAY_SEQUENCE.indexOf(current.nextDay);
  const nextDayIndex = dayIndex + 1;

  if (nextDayIndex < DAY_SEQUENCE.length) {
    return { ...current, nextDay: DAY_SEQUENCE[nextDayIndex] };
  }

  const nextWeek = current.weekNumber + 1;
  if (nextWeek <= 3) {
    return {
      ...current,
      weekNumber: nextWeek as WeekNumber,
      nextDay: DAY_SEQUENCE[0],
    };
  }

  const nextCycle = current.cycleNumber + 1;
  return {
    cycleNumber: nextCycle,
    weekNumber: 1,
    nextDay: DAY_SEQUENCE[0],
    isDeload: nextCycle % 6 === 0,
  };
}

export function resetPrsForNewCycle(
  weights: Record<string, ExerciseWeight>,
  increments: Record<string, number>,
  cycleNumber: number
): Record<string, ExerciseWeight> {
  const updated = { ...weights };
  for (const key of COMPOUND_KEYS) {
    if (!updated[key]) continue;
    const w = updated[key];

    if (cycleNumber === 1) {
      updated[key] = { ...w, pr: null, prStatus: null };
    } else {
      if (w.prStatus === "succeeded") {
        updated[key] = {
          working: w.pr!,
          pr: w.pr! + (increments[key] ?? 5),
          prStatus: "pending",
        };
      } else {
        updated[key] = {
          ...w,
          pr: w.working + (increments[key] ?? 5),
          prStatus: "pending",
        };
      }
    }
  }
  return updated;
}

export function createInitialCycleState(): CycleState {
  return {
    cycleNumber: 1,
    weekNumber: 1,
    nextDay: 1,
    isDeload: false,
  };
}
