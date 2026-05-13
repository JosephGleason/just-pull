import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWorkout, getTargetWeight, getTargetSets } from "../src/hooks/useWorkout";
import { useTimer } from "../src/hooks/useTimer";
import { useSelector } from "@legendapp/state/react";
import { profile$, cycle_state$, weights$, current_session$, workouts$ } from "../src/lib/store";
import { getProgramDay, getSetsForWeek } from "../src/program";
import { SetLogger } from "../src/components/SetLogger";
import { RestTimer } from "../src/components/RestTimer";
import { WorkoutSummary } from "../src/components/WorkoutSummary";
import { SetLog, ExerciseLog, WorkoutLogRow, ExerciseWeightInput, CurrentSessionData, CurrentSessionRow, CycleStateInput, ProfileRow } from "../src/types";
import { generateWarmupSets } from "../src/hooks/useWarmup";
import { WarmupSuggestion } from "../src/components/WarmupSuggestion";
import { colors, typography, spacing, radius } from "../src/theme";

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionRow = useSelector(current_session$) as CurrentSessionRow | null;
  const currentSession: CurrentSessionData | null = sessionRow?.data ?? null;
  const cycleState = (useSelector(cycle_state$) ?? null) as CycleStateInput | null;
  const weights = (useSelector(weights$) ?? {}) as Record<string, ExerciseWeightInput>;
  const profile = useSelector(profile$) as ProfileRow | undefined;
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const history = Object.values(workoutsRecord).sort((a, b) => a.date.localeCompare(b.date));
  const isLoading = !profile;
  const { startWorkout, logSet, undoLastSet, failPr, finishWorkout, discardWorkout } =
    useWorkout();
  const timer = useTimer();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasStartedRef = useRef(false);
  const [warmupDismissed, setWarmupDismissed] = useState<Record<number, boolean>>({});
  const [ready, setReady] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoIndexRef = useRef<{ exerciseIndex: number; setIndex: number } | null>(null);

  // Allow time for current_session$ to sync from Supabase before deciding
  // whether to resume or start fresh
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Start or resume workout on mount
  useEffect(() => {
    if (!ready || isLoading || hasStartedRef.current) return;

    if (currentSession) {
      // Resume: find where we left off
      hasStartedRef.current = true;
      resumeSession(currentSession.exercises);
    } else if (cycleState) {
      hasStartedRef.current = true;
      startWorkout();
    }
  }, [ready, isLoading, currentSession, cycleState]);

  // Clear undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Elapsed workout time
  useEffect(() => {
    if (!currentSession?.started_at) return;
    const update = () => {
      const ms = Date.now() - new Date(currentSession.started_at).getTime();
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setElapsedTime(
        h > 0
          ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `${m}:${String(s).padStart(2, "0")}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [currentSession?.started_at]);

  const resumeSession = (exercises: ExerciseLog[]) => {
    if (!cycleState) return;
    const programDay = getProgramDay(cycleState.next_day);

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const programEx = programDay.exercises.find((pe) => pe.key === ex.key);
      if (!programEx) continue;
      const totalSets = getSetsForWeek(
        programEx,
        cycleState.week_number,
        cycleState.is_deload
      );

      if (ex.sets.length < totalSets) {
        setCurrentExerciseIndex(i);
        setCurrentSetIndex(ex.sets.length);
        return;
      }
    }

    // All exercises done
    setIsComplete(true);
  };

  // Determine current exercise info from the session
  const session = currentSession;
  const exercises = session?.exercises ?? [];
  const currentExercise = exercises[currentExerciseIndex];

  // Get program info for current exercise
  const programDay =
    cycleState ? getProgramDay(session?.day ?? cycleState.next_day) : null;
  const programExercise = programDay?.exercises.find(
    (pe) => pe.key === currentExercise?.key
  );
  const totalSets = programExercise && cycleState
    ? getSetsForWeek(
        programExercise,
        cycleState.week_number,
        cycleState.is_deload
      )
    : 0;

  // Target weight for current exercise
  const targetWeight =
    currentExercise && cycleState
      ? getTargetWeight(currentExercise.key, weights, cycleState)
      : 0;

  // Is this a PR attempt?
  const isPrAttempt =
    cycleState !== null &&
    cycleState.cycle_number > 1 &&
    currentExercise?.type !== "black" &&
    weights[currentExercise?.key]?.pr_status === "pending";

  // Previous performance
  const getPreviousPerformance = (): string | null => {
    if (!currentExercise) return null;
    for (let i = history.length - 1; i >= 0; i--) {
      const log = history[i];
      const exLog = log.exercises.find((e) => e.key === currentExercise.key);
      if (exLog && exLog.sets.length > currentSetIndex) {
        const prevSet = exLog.sets[currentSetIndex];
        return `Last: ${prevSet.weight}${profile?.units ?? "lb"} x ${prevSet.reps}`;
      }
    }
    return null;
  };

  const isChinups = currentExercise?.key.startsWith("chinups") ?? false;

  // Warmup logic: show for first set of non-black exercises
  const showWarmup =
    currentSetIndex === 0 &&
    currentExercise?.type !== "black" &&
    !warmupDismissed[currentExerciseIndex];

  const barWeight = (profile?.units ?? "lb") === "kg" ? 20 : 45;
  const warmupSets = showWarmup
    ? generateWarmupSets(targetWeight, barWeight)
    : [];

  const handleCompleteSet = useCallback(
    async (set: SetLog) => {
      if (!cycleState || !programExercise || !currentExercise) return;

      await logSet(currentExerciseIndex, set);

      // Show undo toast
      undoIndexRef.current = { exerciseIndex: currentExerciseIndex, setIndex: currentSetIndex };
      setShowUndoToast(true);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setShowUndoToast(false);
        undoIndexRef.current = null;
      }, 5000);

      // Dismiss warmup after first working set is logged
      if (currentSetIndex === 0) {
        setWarmupDismissed((prev) => ({ ...prev, [currentExerciseIndex]: true }));
      }

      const nextSetIdx = currentSetIndex + 1;
      const isLastSetOfExercise = nextSetIdx >= totalSets;

      // Check PR failure on last set
      if (isLastSetOfExercise && isPrAttempt) {
        const targetReps = currentExercise.reps;
        // Gather all sets for this exercise including the one just completed
        const allSets = [
          ...(currentSession?.exercises[currentExerciseIndex]?.sets ?? []),
          set,
        ];
        const prSetsFailedTarget = allSets.some(
          (s) => s.is_pr && s.reps < targetReps
        );
        if (prSetsFailedTarget) {
          // PR failed -- mark it
          await failPr(currentExercise.key);
        }
      }

      if (
        !isLastSetOfExercise &&
        isPrAttempt &&
        set.reps < currentExercise.reps
      ) {
        failPr(currentExercise.key);
      }

      // Start rest timer
      const isCompound =
        currentExercise.type === "red" || currentExercise.type === "blue";
      const restSeconds = isCompound
        ? profile?.rest_timer_compound ?? 180
        : profile?.rest_timer_accessory ?? 90;
      timer.start(restSeconds);

      // Advance to next set or next exercise
      if (isLastSetOfExercise) {
        const nextExIdx = currentExerciseIndex + 1;
        if (nextExIdx >= exercises.length) {
          setIsComplete(true);
        } else {
          setCurrentExerciseIndex(nextExIdx);
          setCurrentSetIndex(0);
        }
      } else {
        setCurrentSetIndex(nextSetIdx);
      }
    },
    [
      currentExerciseIndex,
      currentSetIndex,
      totalSets,
      cycleState,
      programExercise,
      currentExercise,
      isPrAttempt,
      exercises.length,
      profile,
      timer,
      session,
    ]
  );

  const handleUndo = useCallback(() => {
    if (!undoIndexRef.current) return;
    const success = undoLastSet();
    if (success) {
      setCurrentExerciseIndex(undoIndexRef.current.exerciseIndex);
      setCurrentSetIndex(undoIndexRef.current.setIndex);
      setIsComplete(false);
    }
    setShowUndoToast(false);
    undoIndexRef.current = null;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoLastSet]);

  const handleFinish = useCallback(async () => {
    await finishWorkout();
    router.replace("/(tabs)");
  }, [finishWorkout, router]);

  const handleDiscard = useCallback(async () => {
    await discardWorkout();
    router.replace("/(tabs)");
  }, [discardWorkout, router]);

  const handleTimerDismiss = useCallback(() => {
    timer.dismiss();
  }, [timer]);

  const handleTimerExtend = useCallback(() => {
    timer.extend(30);
  }, [timer]);

  // Get list of PRs hit for summary
  const prsHit: string[] = exercises
    .filter((ex) => {
      if (ex.type === "black") return false;
      const w = weights[ex.key];
      if (!w || w.pr_status !== "pending") return false;
      return ex.sets.filter((s) => s.is_pr).every((s) => s.reps >= ex.reps);
    })
    .filter((ex) => ex.sets.some((s) => s.is_pr))
    .map((ex) => ex.name);

  // Loading state
  if (isLoading || (!session && !isComplete)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Preparing workout...</Text>
      </View>
    );
  }

  // Summary screen
  if (isComplete) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <WorkoutSummary
          exercises={exercises}
          prsHit={prsHit}
          onFinish={handleFinish}
          onDiscard={handleDiscard}
        />
        {showUndoToast && (
          <View style={styles.undoToast}>
            <Text style={styles.undoText}>Set logged</Text>
            <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
              <Text style={styles.undoButtonText}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Active set logging
  if (!currentExercise || !programExercise) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {elapsedTime ? (
        <Text style={styles.elapsedTime}>{elapsedTime}</Text>
      ) : null}
      {showWarmup && warmupSets.length > 0 && (
        <WarmupSuggestion
          warmupSets={warmupSets}
          units={profile?.units ?? "lb"}
          onDismiss={() =>
            setWarmupDismissed((prev) => ({
              ...prev,
              [currentExerciseIndex]: true,
            }))
          }
        />
      )}

      <RestTimer
        secondsLeft={timer.secondsLeft}
        isRunning={timer.isRunning}
        progress={timer.progress}
        onDismiss={handleTimerDismiss}
        onExtend={handleTimerExtend}
      />

      <SetLogger
        exerciseName={currentExercise.name}
        exerciseKey={currentExercise.key}
        exerciseType={currentExercise.type}
        setNumber={currentSetIndex + 1}
        totalSets={totalSets}
        targetReps={currentExercise.reps}
        weight={targetWeight}
        isPrAttempt={isPrAttempt}
        previousPerformance={getPreviousPerformance()}
        units={profile?.units ?? "lb"}
        isChinups={isChinups}
        onComplete={handleCompleteSet}
        onWeightChange={() => {}}
      />

      {showUndoToast && (
        <View style={styles.undoToast}>
          <Text style={styles.undoText}>Set logged</Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    ...typography.body,
    marginTop: spacing.md,
  },
  elapsedTime: {
    color: colors.textTertiary,
    ...typography.caption,
    textAlign: "right",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  undoToast: {
    position: "absolute",
    bottom: 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  undoText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  undoButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
  undoButtonText: {
    color: colors.accent,
    ...typography.bodyBold,
  },
});
