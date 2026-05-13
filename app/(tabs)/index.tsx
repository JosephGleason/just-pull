import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { profile$, cycle_state$, weights$, current_session$, nutrition$ } from "../../src/lib/store";
import { getProgramDay, getSetsForWeek } from "../../src/program";
import { getTargetWeight } from "../../src/hooks/useWorkout";
import { calculateNutrition } from "../../src/hooks/useNutrition";
import { ExerciseCard } from "../../src/components/ExerciseCard";
import { NutritionCard } from "../../src/components/NutritionCard";
import { ProfileRow, CycleStateInput, ExerciseWeightInput, NutritionInput, CurrentSessionData, CurrentSessionRow } from "../../src/types";
import { colors, typography, spacing, radius } from "../../src/theme";

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = profile$.get() as ProfileRow | undefined;
  const cycleState = (cycle_state$.get() ?? null) as CycleStateInput | null;
  const weights = (weights$.get() ?? {}) as Record<string, ExerciseWeightInput>;
  const sessionRow = current_session$.get() as CurrentSessionRow | null;
  const currentSession: CurrentSessionData | null = sessionRow?.data ?? null;
  const nutritionData = (nutrition$.get() ?? null) as NutritionInput | null;
  const isLoading = !profile;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const programDay = cycleState ? getProgramDay(cycleState.next_day) : null;

  if (!cycleState || !profile || !programDay) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Set up your weights in Settings to get started.
        </Text>
      </View>
    );
  }
  const nutritionTargets =
    nutritionData
      ? calculateNutrition(nutritionData, profile.units)
      : null;

  const isChinupsKey = (key: string) => key.startsWith("chinups");

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
      >
        {/* Resume Workout Banner */}
        {currentSession && (
          <TouchableOpacity
            style={styles.resumeBanner}
            onPress={() => router.push("/workout")}
            activeOpacity={0.8}
          >
            <Text style={styles.resumeLabel}>Workout in progress</Text>
            <Text style={styles.resumeAction}>Resume</Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <Text style={styles.dayNumber}>DAY {cycleState.next_day}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerSubtitle}>
            Week {cycleState.week_number}, Cycle {cycleState.cycle_number}
          </Text>
          {cycleState.is_deload && (
            <View style={styles.deloadBadge}>
              <Text style={styles.deloadText}>DELOAD</Text>
            </View>
          )}
        </View>

        {/* Nutrition Card */}
        {nutritionTargets && <NutritionCard targets={nutritionTargets} />}

        {/* Exercise List */}
        {programDay.exercises.map((exercise) => {
          const sets = getSetsForWeek(
            exercise,
            cycleState.week_number,
            cycleState.is_deload
          );
          const weight = getTargetWeight(exercise.key, weights, cycleState);
          const isResting = sets === 0;

          return (
            <ExerciseCard
              key={exercise.key}
              name={exercise.name}
              sets={sets}
              reps={exercise.reps}
              weight={weight}
              type={exercise.type}
              isResting={isResting}
              units={profile.units}
              isChinups={isChinupsKey(exercise.key)}
            />
          );
        })}
      </ScrollView>

      {/* Start Workout Button */}
      {!currentSession && (
        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
          onPress={() => router.push("/workout")}
        >
          <Text style={styles.startButtonText}>
            Begin{" "}
            <Text style={styles.startButtonDay}>Day {cycleState.next_day}</Text>
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  resumeBanner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumeLabel: {
    color: colors.text,
    ...typography.body,
  },
  resumeAction: {
    color: colors.accent,
    ...typography.bodyBold,
  },
  dayNumber: {
    color: colors.text,
    ...typography.displayLarge,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  deloadBadge: {
    backgroundColor: colors.accentGlow,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  deloadText: {
    color: colors.accent,
    ...typography.caption,
  },
  startButton: {
    position: "absolute",
    bottom: 24,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
  },
  startButtonDay: {
    color: colors.bg,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 20,
  },
});
