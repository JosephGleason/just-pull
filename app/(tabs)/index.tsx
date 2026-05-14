import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSelector } from "@legendapp/state/react";
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
  const profile = useSelector(profile$) as ProfileRow | undefined;
  const cycleState = (useSelector(cycle_state$) ?? null) as CycleStateInput | null;
  const weights = (useSelector(weights$) ?? {}) as Record<string, ExerciseWeightInput>;
  const sessionRow = useSelector(current_session$) as CurrentSessionRow | null;
  const currentSession: CurrentSessionData | null = sessionRow?.data ?? null;
  const nutritionData = (useSelector(nutrition$) ?? null) as NutritionInput | null;
  const [showProgramInfo, setShowProgramInfo] = useState(false);
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
          <Pressable
            onPress={() => setShowProgramInfo(true)}
            hitSlop={12}
            accessibilityLabel="Program information"
            accessibilityRole="button"
            style={styles.infoButton}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Program Info Modal */}
        <Modal
          visible={showProgramInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProgramInfo(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>The Program</Text>

                <Text style={styles.sectionHeader}>Schedule</Text>
                <Text style={styles.sectionBody}>
                  5 training days per week: Days 1, 2, 3, 5, and 6. Days 4 and
                  7 are rest days.
                </Text>

                <Text style={styles.sectionHeader}>3-Week Cycles</Text>
                <Text style={styles.sectionBody}>
                  Sets taper each week to manage fatigue. Week 1 is full volume,
                  Week 2 is reduced, and Week 3 is minimal. After each cycle,
                  weights increase and the cycle resets.
                </Text>

                <Text style={styles.sectionHeader}>Exercise Types</Text>
                <Text style={styles.sectionBody}>
                  Compounds (red) are the main lifts and increase each cycle.
                  Heavy compounds (blue) like squat and deadlift follow the same
                  progression with fewer sets. Accessories (black) are AMRAP
                  sets where you hit the target reps or more.
                </Text>

                <Text style={styles.sectionHeader}>Deload</Text>
                <Text style={styles.sectionBody}>
                  Every 3rd cycle is a deload that reduces set counts further,
                  giving your body time to recover before pushing heavier.
                </Text>

                <Text style={styles.sectionHeader}>PR Progression</Text>
                <Text style={styles.sectionBody}>
                  After each cycle, compound weights increase by your set
                  increment. If you fail reps on a PR attempt, the weight stays
                  the same next cycle until you hit the target.
                </Text>
              </ScrollView>

              <Pressable
                onPress={() => setShowProgramInfo(false)}
                style={styles.modalCloseButton}
                accessibilityLabel="Close program info"
                accessibilityRole="button"
              >
                <Text style={styles.modalCloseText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

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
  infoButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    ...typography.title,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    color: colors.textSecondary,
    ...typography.caption,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    color: colors.text,
    ...typography.body,
    lineHeight: 22,
  },
  modalCloseButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  modalCloseText: {
    color: colors.accent,
    ...typography.bodyBold,
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
