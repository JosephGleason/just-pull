import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWorkout, getTargetWeight, getTargetSets } from "../src/hooks/useWorkout";
import { useTimer } from "../src/hooks/useTimer";
import { useAppContext } from "../src/context";
import { getProgramDay, getSetsForWeek } from "../src/program";
import { SetLogger } from "../src/components/SetLogger";
import { RestTimer } from "../src/components/RestTimer";
import { WorkoutSummary } from "../src/components/WorkoutSummary";
import { SetLog, ExerciseLog } from "../src/types";
import { colors, typography, spacing } from "../src/theme";

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentSession,
    cycleState,
    weights,
    settings,
    history,
    isLoading,
  } = useAppContext();
  const { startWorkout, logSet, failPr, finishWorkout, discardWorkout } =
    useWorkout();
  const timer = useTimer();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasStartedRef = useRef(false);

  // Start or resume workout on mount
  useEffect(() => {
    if (isLoading || hasStartedRef.current) return;

    if (currentSession) {
      // Resume: find where we left off
      hasStartedRef.current = true;
      resumeSession(currentSession.exercises);
    } else if (cycleState) {
      hasStartedRef.current = true;
      startWorkout();
    }
  }, [isLoading, currentSession, cycleState]);

  const resumeSession = (exercises: ExerciseLog[]) => {
    if (!cycleState) return;
    const programDay = getProgramDay(cycleState.nextDay);

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const programEx = programDay.exercises.find((pe) => pe.key === ex.key);
      if (!programEx) continue;
      const totalSets = getSetsForWeek(
        programEx,
        cycleState.weekNumber,
        cycleState.isDeload
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
    cycleState ? getProgramDay(session?.day ?? cycleState.nextDay) : null;
  const programExercise = programDay?.exercises.find(
    (pe) => pe.key === currentExercise?.key
  );
  const totalSets = programExercise && cycleState
    ? getSetsForWeek(
        programExercise,
        cycleState.weekNumber,
        cycleState.isDeload
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
    cycleState.cycleNumber > 1 &&
    currentExercise?.type !== "black" &&
    weights[currentExercise?.key]?.prStatus === "pending";

  // Previous performance
  const getPreviousPerformance = (): string | null => {
    if (!currentExercise) return null;
    for (let i = history.length - 1; i >= 0; i--) {
      const log = history[i];
      const exLog = log.exercises.find((e) => e.key === currentExercise.key);
      if (exLog && exLog.sets.length > currentSetIndex) {
        const prevSet = exLog.sets[currentSetIndex];
        return `Last: ${prevSet.weight}${settings?.units ?? "lb"} x ${prevSet.reps}`;
      }
    }
    return null;
  };

  const isChinups = currentExercise?.key.startsWith("chinups") ?? false;

  const handleCompleteSet = useCallback(
    async (set: SetLog) => {
      if (!cycleState || !programExercise || !currentExercise) return;

      await logSet(currentExerciseIndex, set);

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
          (s) => s.isPr && s.reps < targetReps
        );
        if (prSetsFailedTarget) {
          // PR failed -- mark it
          await failPr(currentExercise.key);
        }
      }

      // If not last set of exercise and the set was a PR failure mid-exercise,
      // prompt the user
      if (
        !isLastSetOfExercise &&
        isPrAttempt &&
        set.reps < currentExercise.reps
      ) {
        Alert.alert(
          "PR Attempt",
          `Failed to hit ${currentExercise.reps} reps. Drop to working weight for rest of cycle?`,
          [
            { text: "Keep PR Weight", style: "cancel" },
            {
              text: "Drop Weight",
              onPress: () => failPr(currentExercise.key),
            },
          ]
        );
      }

      // Start rest timer
      const isCompound =
        currentExercise.type === "red" || currentExercise.type === "blue";
      const restSeconds = isCompound
        ? settings?.restTimerCompound ?? 180
        : settings?.restTimerAccessory ?? 90;
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
      settings,
      timer,
      currentSession,
    ]
  );

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
      if (!w || w.prStatus !== "pending") return false;
      return ex.sets.filter((s) => s.isPr).every((s) => s.reps >= ex.reps);
    })
    .filter((ex) => ex.sets.some((s) => s.isPr))
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
        units={settings?.units ?? "lb"}
        isChinups={isChinups}
        onComplete={handleCompleteSet}
        onWeightChange={() => {}}
      />

      {/* Rest timer overlay at top -- does not block SetLogger */}
      <RestTimer
        secondsLeft={timer.secondsLeft}
        isRunning={timer.isRunning}
        progress={timer.progress}
        onDismiss={handleTimerDismiss}
        onExtend={handleTimerExtend}
      />
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
});
