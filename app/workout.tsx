import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { ExerciseProgressStrip } from "../src/components/ExerciseProgressStrip";
import { WorkoutSummary } from "../src/components/WorkoutSummary";
import { SetLog, ExerciseLog, WorkoutLogRow, ExerciseWeightInput, CurrentSessionData, CurrentSessionRow, CycleStateInput, ProfileRow, TrainingDay, WeekNumber } from "../src/types";
import { generateWarmupSets } from "../src/hooks/useWarmup";
import { WarmupSuggestion } from "../src/components/WarmupSuggestion";
import { colors, typography, spacing, radius, fonts } from "../src/theme";

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionRow = useSelector(current_session$) as CurrentSessionRow | null;
  const currentSession: CurrentSessionData | null = sessionRow?.data ?? null;
  const cycleState = (useSelector(cycle_state$) ?? null) as CycleStateInput | null;
  const weights = (useSelector(weights$) ?? {}) as Record<string, ExerciseWeightInput>;
  const profile = useSelector(profile$) as ProfileRow | undefined;
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const history = useMemo(() =>
    Object.values(workoutsRecord).sort((a, b) => a.date.localeCompare(b.date)),
    [workoutsRecord]
  );
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
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState("");
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoCallbackRef = useRef<(() => void) | null>(null);

  // Wait for current_session$ to hydrate before deciding whether to resume or
  // start fresh.  We set ready=true as soon as the observable has a non-undefined
  // value (session exists → resume it) or after a 2-second ceiling (no session →
  // start new).  This replaces the old fixed 500ms timeout that could race against
  // slow AsyncStorage / Supabase hydration and accidentally discard a mid-crash
  // session.
  useEffect(() => {
    // If current_session$ already has a value, we're ready immediately.
    if (current_session$.get() !== undefined) {
      setReady(true);
      return;
    }

    let cancelled = false;

    // Watch for session hydration reactively.
    const dispose = current_session$.onChange(() => {
      if (!cancelled) {
        cancelled = true;
        dispose();
        setReady(true);
      }
    });

    // Safety ceiling: don't wait forever if there truly is no session.
    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        dispose();
        setReady(true);
      }
    }, 2000);

    return () => {
      cancelled = true;
      dispose();
      clearTimeout(timeout);
    };
  }, []);

  // Start or resume workout on mount
  useEffect(() => {
    if (!ready || isLoading || hasStartedRef.current) return;

    if (currentSession) {
      // Resume: find where we left off
      hasStartedRef.current = true;
      resumeSession(currentSession);
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

  const resumeSession = (sessionData: CurrentSessionData) => {
    const programDay = getProgramDay(sessionData.day as TrainingDay);

    for (let i = 0; i < sessionData.exercises.length; i++) {
      const ex = sessionData.exercises[i];
      const programEx = programDay.exercises.find((pe) => pe.key === ex.key);
      if (!programEx) continue;
      const totalSets = getSetsForWeek(
        programEx,
        sessionData.week as WeekNumber,
        cycleState?.is_deload ?? false
      );

      if (ex.sets.length < totalSets) {
        setCurrentExerciseIndex(i);
        setCurrentSetIndex(ex.sets.length);
        return;
      }
    }

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

  const showUndo = useCallback((message: string, callback: () => void) => {
    undoCallbackRef.current = callback;
    setUndoMessage(message);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
  }, []);

  const handleNavigateTo = useCallback((targetIndex: number) => {
    if (targetIndex === currentExerciseIndex) return;
    timer.dismiss();
    setCurrentExerciseIndex(targetIndex);
    const ex = exercises[targetIndex];
    const logged = ex?.sets?.length ?? 0;
    setCurrentSetIndex(logged);
    setIsComplete(false);
  }, [currentExerciseIndex, exercises, timer]);

  const handleSkipExercise = useCallback(() => {
    const prevExIndex = currentExerciseIndex;
    const prevSetIndex = currentSetIndex;
    const skippedName = currentExercise?.name ?? "exercise";

    if (currentExerciseIndex >= exercises.length - 1) {
      setIsComplete(true);
    } else {
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      setCurrentSetIndex(exercises[nextIdx]?.sets?.length ?? 0);
    }

    timer.dismiss();
    showUndo(`Skipped ${skippedName}`, () => {
      setCurrentExerciseIndex(prevExIndex);
      setCurrentSetIndex(prevSetIndex);
      setIsComplete(false);
    });
  }, [currentExerciseIndex, currentSetIndex, currentExercise, exercises.length, timer, showUndo]);

  const handleCompleteSet = useCallback(
    async (set: SetLog) => {
      if (!cycleState || !programExercise || !currentExercise) return;

      await logSet(currentExerciseIndex, set);

      // Show undo toast
      const prevExIdx = currentExerciseIndex;
      const prevSetIdx = currentSetIndex;
      showUndo("Set logged", () => {
        const success = undoLastSet();
        if (success) {
          setCurrentExerciseIndex(prevExIdx);
          setCurrentSetIndex(prevSetIdx);
          setIsComplete(false);
        }
      });

      // Dismiss warmup after first working set is logged
      if (currentSetIndex === 0) {
        setWarmupDismissed((prev) => ({ ...prev, [currentExerciseIndex]: true }));
      }

      const nextSetIdx = currentSetIndex + 1;
      const isLastSetOfExercise = nextSetIdx >= totalSets;

      if (isPrAttempt && set.is_pr && (set.reps < currentExercise.reps || set.failed)) {
        failPr(currentExercise.key);
      }

      // Start rest timer (skip after last set of last exercise)
      const isLastWorkoutSet =
        isLastSetOfExercise && currentExerciseIndex >= exercises.length - 1;
      if (!isLastWorkoutSet) {
        const isCompound =
          currentExercise.type === "red" || currentExercise.type === "blue";
        const restSeconds = isCompound
          ? profile?.rest_timer_compound ?? 180
          : profile?.rest_timer_accessory ?? 90;
        timer.start(restSeconds);
      }

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
      showUndo,
      undoLastSet,
    ]
  );

  const handleUndo = useCallback(() => {
    undoCallbackRef.current?.();
    setUndoMessage(null);
    undoCallbackRef.current = null;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

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

  const handleTimerAdjust = useCallback((seconds: number) => {
    timer.adjust(seconds);
  }, [timer]);

  // Get list of PRs hit for summary
  const prsHit: string[] = exercises
    .filter((ex) => {
      if (ex.type === "black") return false;
      const w = weights[ex.key];
      if (!w || w.pr_status !== "pending") return false;
      const prSets = ex.sets.filter((s) => s.is_pr);
      return prSets.length > 0 && prSets.every((s) => s.reps >= ex.reps && !s.failed);
    })
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
          isFirstWorkout={history.length === 0}
        />
        {undoMessage ? (
          <View style={styles.undoToast}>
            <Text style={styles.undoText}>{undoMessage}</Text>
            <TouchableOpacity onPress={handleUndo} style={styles.undoButton} accessibilityLabel="Undo" accessibilityRole="button">
              <Text style={styles.undoButtonText}>Undo</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
        <View style={styles.statusStrip}>
          <Text style={styles.statusLabel}>● SESSION · LIVE</Text>
          <Text style={styles.elapsedTime}>{elapsedTime}</Text>
        </View>
      ) : null}

      <ExerciseProgressStrip
        exercises={exercises}
        currentIndex={currentExerciseIndex}
        onNavigateTo={handleNavigateTo}
      />

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
        totalDuration={timer.totalDuration}
        isRunning={timer.isRunning}
        progress={timer.progress}
        onDismiss={handleTimerDismiss}
        onAdjust={handleTimerAdjust}
        nextExerciseName={
          timer.isRunning && currentSetIndex === 0
            ? currentExercise?.name
            : undefined
        }
        exerciseProgress={
          timer.isRunning
            ? `Exercise ${currentExerciseIndex + 1} of ${exercises.length}`
            : undefined
        }
      />

      <SetLogger
        key={currentExercise.key}
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
        onSkip={handleSkipExercise}
        lastSet={
          currentExercise.sets.length > 0
            ? currentExercise.sets[currentExercise.sets.length - 1]
            : null
        }
        loggedSets={currentExercise.sets}
      />

      {undoMessage ? (
        <View style={styles.undoToast}>
          <Text style={styles.undoText}>{undoMessage}</Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton} accessibilityLabel="Undo" accessibilityRole="button">
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusLabel: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  elapsedTime: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textAlign: "right",
  },
  undoToast: {
    position: "absolute",
    bottom: 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  undoText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  undoButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
  undoButtonText: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 16,
  },
});
