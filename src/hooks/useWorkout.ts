import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { CurrentSessionData, ExerciseLog, SetLog, WorkoutLogInput, ProgramExercise, ExerciseWeightInput, CycleStateInput } from "../types";
import { getProgramDay, getSetsForWeek } from "../program";
import { advanceCycleState, resetPrsForNewCycle } from "./useCycleState";
import { weights$, cycle_state$, current_session$, increments$, workouts$ } from "../lib/store";

export function getTargetSets(
  exerciseKey: string,
  cycleState: CycleStateInput,
  programExercises: ProgramExercise[]
): number {
  const exercise = programExercises.find((e) => e.key === exerciseKey);
  if (!exercise) return 0;
  return getSetsForWeek(exercise, cycleState.week_number, cycleState.is_deload);
}

export function getTargetWeight(
  exerciseKey: string,
  weights: Record<string, ExerciseWeightInput>,
  cycleState: CycleStateInput
): number {
  const w = weights[exerciseKey];
  if (!w) return 0;

  // Black exercises (no PR tracking) — always return working weight
  if (w.pr_status === null) return w.working;

  // Cycle 1 — always use working weight (PRs not yet set)
  if (cycleState.cycle_number <= 1) return w.working;

  // Cycle 2+: use PR weight if pending or succeeded, working weight otherwise
  if ((w.pr_status === "pending" || w.pr_status === "succeeded") && w.pr !== null) {
    return w.pr;
  }

  return w.working;
}

export function buildSessionExercises(
  cycleState: CycleStateInput,
  weights: Record<string, ExerciseWeightInput>
): ExerciseLog[] {
  const programDay = getProgramDay(cycleState.next_day);
  const exercises: ExerciseLog[] = [];

  for (const programExercise of programDay.exercises) {
    const sets = getSetsForWeek(programExercise, cycleState.week_number, cycleState.is_deload);
    if (sets === 0) continue;

    exercises.push({
      name: programExercise.name,
      key: programExercise.key,
      reps: programExercise.reps,
      type: programExercise.type,
      sets: [],
    });
  }

  return exercises;
}

let lastSessionSnapshot: CurrentSessionData | null = null;

export function useWorkout() {
  const startWorkout = () => {
    const cycleState = cycle_state$.get();
    if (!cycleState) return;

    const currentWeights = weights$.get() ?? {};
    const exercises = buildSessionExercises(cycleState, currentWeights);
    const sessionData: CurrentSessionData = {
      started_at: new Date().toISOString(),
      day: cycleState.next_day,
      week: cycleState.week_number,
      cycle: cycleState.cycle_number,
      exercises,
    };
    current_session$.set({ id: (cycleState as any).id, data: sessionData } as any);
  };

  const logSet = (exerciseIndex: number, set: SetLog) => {
    const sessionRow = current_session$.get();
    if (!sessionRow?.data) return;

    const currentData = sessionRow.data;

    // Snapshot before mutation so undoLastSet can restore
    lastSessionSnapshot = {
      ...currentData,
      exercises: currentData.exercises.map((ex: ExerciseLog) => ({
        ...ex,
        sets: [...ex.sets],
      })),
    };

    const updatedExercises = currentData.exercises.map((ex: ExerciseLog, i: number) => {
      if (i !== exerciseIndex) return ex;
      return { ...ex, sets: [...ex.sets, set] };
    });

    const updatedData: CurrentSessionData = { ...currentData, exercises: updatedExercises };
    current_session$.data.set(updatedData);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const undoLastSet = () => {
    if (!lastSessionSnapshot) return false;
    current_session$.data.set(lastSessionSnapshot);
    lastSessionSnapshot = null;
    return true;
  };

  const failPr = (exerciseKey: string) => {
    const w = weights$[exerciseKey].get();
    if (!w) return;
    weights$[exerciseKey].pr_status.set("failed" as const);
  };

  const finishWorkout = () => {
    const sessionRow = current_session$.get();
    const cycleState = cycle_state$.get();
    if (!sessionRow?.data || !cycleState) return;

    const currentData = sessionRow.data;
    const currentWeights = weights$.get() ?? {};

    // Check PR success for compound exercises
    for (const ex of currentData.exercises) {
      const w = currentWeights[ex.key];
      if (!w || w.pr_status !== "pending" || w.pr === null) continue;

      // Check if all PR sets hit target reps
      const prSets = ex.sets.filter((s: SetLog) => s.is_pr);
      if (prSets.length > 0 && prSets.every((s: SetLog) => s.reps >= ex.reps)) {
        weights$[ex.key].set({ ...w, pr_status: "succeeded" as const });
      }
    }

    const workoutLog: WorkoutLogInput = {
      id: Crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      day: currentData.day,
      week: currentData.week,
      cycle: currentData.cycle,
      exercises: currentData.exercises,
      completed_at: new Date().toISOString(),
    };

    workouts$[workoutLog.id].set(workoutLog as any);

    // Advance cycle state
    const newCycleState = advanceCycleState(cycleState);
    const isNewCycle = newCycleState.cycle_number !== cycleState.cycle_number;

    if (isNewCycle) {
      const currentIncrements = increments$.get() ?? {};
      const resetWeights = resetPrsForNewCycle(
        weights$.get() ?? {},
        currentIncrements,
        newCycleState.cycle_number
      );
      for (const [key, newWeight] of Object.entries(resetWeights)) {
        weights$[key].set(newWeight as any);
      }
    }

    const existing = cycle_state$.get();
    cycle_state$.set({ ...existing, ...newCycleState } as any);
    current_session$.set(null as any);
  };

  const discardWorkout = () => {
    current_session$.set(null as any);
  };

  return {
    startWorkout,
    logSet,
    undoLastSet,
    failPr,
    finishWorkout,
    discardWorkout,
  };
}
