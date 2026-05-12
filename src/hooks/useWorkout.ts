import { v4 as uuid } from "uuid";
import * as Haptics from "expo-haptics";
import { CurrentSession, ExerciseLog, SetLog, WorkoutLog, ProgramExercise, ExerciseWeight, CycleState } from "../types";
import { getProgramDay, getSetsForWeek } from "../program";
import { advanceCycleState, resetPrsForNewCycle } from "./useCycleState";
import { useAppContext } from "../context";

export function getTargetSets(
  exerciseKey: string,
  cycleState: CycleState,
  programExercises: ProgramExercise[]
): number {
  const exercise = programExercises.find((e) => e.key === exerciseKey);
  if (!exercise) return 0;
  return getSetsForWeek(exercise, cycleState.weekNumber, cycleState.isDeload);
}

export function getTargetWeight(
  exerciseKey: string,
  weights: Record<string, ExerciseWeight>,
  cycleState: CycleState
): number {
  const w = weights[exerciseKey];
  if (!w) return 0;

  // Black exercises (no PR tracking) — always return working weight
  if (w.prStatus === null) return w.working;

  // Cycle 1 — always use working weight (PRs not yet set)
  if (cycleState.cycleNumber <= 1) return w.working;

  // Cycle 2+: use PR weight if pending or succeeded, working weight otherwise
  if ((w.prStatus === "pending" || w.prStatus === "succeeded") && w.pr !== null) {
    return w.pr;
  }

  return w.working;
}

export function buildSessionExercises(
  cycleState: CycleState,
  weights: Record<string, ExerciseWeight>
): ExerciseLog[] {
  const programDay = getProgramDay(cycleState.nextDay);
  const exercises: ExerciseLog[] = [];

  for (const programExercise of programDay.exercises) {
    const sets = getSetsForWeek(programExercise, cycleState.weekNumber, cycleState.isDeload);
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

export function useWorkout() {
  const {
    cycleState,
    weights,
    settings,
    currentSession,
    setCurrentSession,
    addWorkout,
    setCycleState,
    setWeights,
  } = useAppContext();

  const startWorkout = async () => {
    if (!cycleState) return;

    const exercises = buildSessionExercises(cycleState, weights);
    const session: CurrentSession = {
      startedAt: new Date().toISOString(),
      day: cycleState.nextDay,
      week: cycleState.weekNumber,
      cycle: cycleState.cycleNumber,
      exercises,
    };
    await setCurrentSession(session);
  };

  const logSet = async (exerciseIndex: number, set: SetLog) => {
    if (!currentSession) return;

    const updatedExercises = currentSession.exercises.map((ex, i) => {
      if (i !== exerciseIndex) return ex;
      return { ...ex, sets: [...ex.sets, set] };
    });

    const updated: CurrentSession = { ...currentSession, exercises: updatedExercises };
    await setCurrentSession(updated);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const failPr = async (exerciseKey: string) => {
    const w = weights[exerciseKey];
    if (!w) return;
    const updatedWeights = {
      ...weights,
      [exerciseKey]: { ...w, prStatus: "failed" as const },
    };
    await setWeights(updatedWeights);
  };

  const finishWorkout = async () => {
    if (!currentSession || !cycleState) return;

    const programDay = getProgramDay(currentSession.day);

    // Check PR success for compound exercises
    let updatedWeights = { ...weights };
    for (const ex of currentSession.exercises) {
      const w = updatedWeights[ex.key];
      if (!w || w.prStatus !== "pending" || w.pr === null) continue;

      // Check if all PR sets hit target reps
      const prSets = ex.sets.filter((s) => s.isPr);
      if (prSets.length > 0 && prSets.every((s) => s.reps >= ex.reps)) {
        updatedWeights[ex.key] = { ...w, prStatus: "succeeded" as const };
      }
    }

    if (updatedWeights !== weights) {
      await setWeights(updatedWeights);
    }

    const workoutLog: WorkoutLog = {
      id: uuid(),
      date: new Date().toISOString().split("T")[0],
      day: currentSession.day,
      week: currentSession.week,
      cycle: currentSession.cycle,
      exercises: currentSession.exercises,
      completedAt: new Date().toISOString(),
    };

    await addWorkout(workoutLog);

    // Advance cycle state
    const newCycleState = advanceCycleState(cycleState);
    const isNewCycle = newCycleState.cycleNumber !== cycleState.cycleNumber;

    let finalWeights = updatedWeights;
    if (isNewCycle && settings) {
      finalWeights = resetPrsForNewCycle(updatedWeights, settings.increments, newCycleState.cycleNumber);
      await setWeights(finalWeights);
    }

    await setCycleState(newCycleState);
    await setCurrentSession(null);
  };

  const discardWorkout = async () => {
    await setCurrentSession(null);
  };

  return {
    startWorkout,
    logSet,
    failPr,
    finishWorkout,
    discardWorkout,
  };
}
