import { CycleStateInput, TrainingDay, WeekNumber, ExerciseWeightInput } from "../types";
import { DAY_SEQUENCE, COMPOUND_KEYS } from "../program";

export function advanceCycleState(current: CycleStateInput): CycleStateInput {
  const dayIndex = DAY_SEQUENCE.indexOf(current.next_day);
  const nextDayIndex = dayIndex + 1;

  if (nextDayIndex < DAY_SEQUENCE.length) {
    return { ...current, next_day: DAY_SEQUENCE[nextDayIndex] };
  }

  const nextWeek = current.week_number + 1;
  if (nextWeek <= 3) {
    return {
      ...current,
      week_number: nextWeek as WeekNumber,
      next_day: DAY_SEQUENCE[0],
    };
  }

  const nextCycle = current.cycle_number + 1;
  return {
    cycle_number: nextCycle,
    week_number: 1,
    next_day: DAY_SEQUENCE[0],
    is_deload: nextCycle % 6 === 0,
  };
}

export function resetPrsForNewCycle(
  weights: Record<string, ExerciseWeightInput>,
  increments: Record<string, { increment: number }>,
  cycle_number: number
): Record<string, ExerciseWeightInput> {
  const updated = { ...weights };
  for (const key of COMPOUND_KEYS) {
    if (!updated[key]) continue;
    const w = updated[key];

    if (cycle_number === 1) {
      updated[key] = { exercise_key: key, working: w.working, pr: null, pr_status: null, fail_count: 0 };
    } else {
      if (w.pr_status === "succeeded") {
        updated[key] = {
          exercise_key: key,
          working: w.pr!,
          pr: w.pr! + (increments[key]?.increment ?? 5),
          pr_status: "pending",
          fail_count: 0,
        };
      } else {
        const newFailCount = (w.fail_count ?? 0) + 1;
        if (newFailCount >= 2) {
          const reduced = Math.round(w.working * 0.9 / 2.5) * 2.5;
          updated[key] = {
            exercise_key: key,
            working: reduced,
            pr: reduced + (increments[key]?.increment ?? 5),
            pr_status: "pending",
            fail_count: 0,
          };
        } else {
          updated[key] = {
            exercise_key: key,
            working: w.working,
            pr: w.working + (increments[key]?.increment ?? 5),
            pr_status: "pending",
            fail_count: newFailCount,
          };
        }
      }
    }
  }
  return updated;
}

export function createInitialCycleState(): CycleStateInput {
  return {
    cycle_number: 1,
    week_number: 1,
    next_day: 1,
    is_deload: false,
  };
}
