import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppContext } from "../../src/context";
import { getProgramDay, getSetsForWeek } from "../../src/program";
import { getTargetWeight } from "../../src/hooks/useWorkout";
import { calculateNutrition } from "../../src/hooks/useNutrition";
import { ExerciseCard } from "../../src/components/ExerciseCard";
import { NutritionCard } from "../../src/components/NutritionCard";
import { colors, typography, spacing, radius } from "../../src/theme";

export default function TodayScreen() {
  const router = useRouter();
  const { settings, cycleState, weights, currentSession, isLoading } =
    useAppContext();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!cycleState || !settings) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Set up your weights in Settings to get started.
        </Text>
      </View>
    );
  }

  const programDay = getProgramDay(cycleState.nextDay);
  const nutritionTargets =
    settings.nutrition
      ? calculateNutrition(settings.nutrition, settings.units)
      : null;

  const isChinupsKey = (key: string) => key.startsWith("chinups");

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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
        <Text style={styles.dayLabel}>DAY {cycleState.nextDay}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            Week {cycleState.weekNumber}, Cycle {cycleState.cycleNumber}
          </Text>
          {cycleState.isDeload && (
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
            cycleState.weekNumber,
            cycleState.isDeload
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
              units={settings.units}
              isChinups={isChinupsKey(exercise.key)}
            />
          );
        })}
      </ScrollView>

      {/* Start Workout Button */}
      {!currentSession && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push("/workout")}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
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
  dayLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    ...typography.title,
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
  startButtonText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
  },
});
