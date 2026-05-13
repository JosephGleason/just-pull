import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { WorkoutLogRow, CycleStateInput } from "../types";
import { colors, typography, spacing, radius, fonts } from "../theme";

interface MuscleHeatmapProps {
  history: WorkoutLogRow[];
  cycleState: CycleStateInput;
}

type MuscleGroup =
  | "chest"
  | "shoulders"
  | "biceps"
  | "quads"
  | "calves"
  | "back"
  | "triceps"
  | "forearms"
  | "glutes"
  | "hamstrings";

const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
  deadlift_4: ["back", "glutes", "hamstrings", "forearms"],
  squat_4: ["quads", "glutes", "hamstrings"],
  squat_8: ["quads", "glutes", "hamstrings"],
  bench_4: ["chest", "shoulders", "triceps"],
  bench_8: ["chest", "shoulders", "triceps"],
  ohp_4: ["shoulders", "triceps"],
  ohp_8: ["shoulders", "triceps"],
  chinups_4: ["back", "biceps"],
  chinups_8: ["back", "biceps"],
  bb_rows_4: ["back", "biceps", "forearms"],
  bb_rows_8: ["back", "biceps", "forearms"],
  incline_press_4: ["chest", "shoulders", "triceps"],
  incline_press_8: ["chest", "shoulders", "triceps"],
  curls_12: ["biceps"],
  flies_12: ["chest"],
  tricep_ext_12: ["triceps"],
  calf_raise_12: ["calves"],
  rear_delt_fly_12: ["shoulders", "back"],
  lat_raise_12: ["shoulders"],
};

const FRONT_MUSCLES: MuscleGroup[] = [
  "chest",
  "shoulders",
  "biceps",
  "quads",
  "calves",
];
const BACK_MUSCLES: MuscleGroup[] = [
  "back",
  "triceps",
  "forearms",
  "glutes",
  "hamstrings",
];

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  shoulders: "Shoulders",
  biceps: "Biceps",
  quads: "Quads",
  calves: "Calves",
  back: "Back",
  triceps: "Triceps",
  forearms: "Forearms",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
};

type HeatLevel = "cold" | "warm" | "hot" | "fire";

function getHeatLevel(sets: number): HeatLevel {
  if (sets === 0) return "cold";
  if (sets <= 3) return "warm";
  if (sets <= 6) return "hot";
  return "fire";
}

function getHeatStyles(level: HeatLevel): {
  backgroundColor: string;
  textColor: string;
  countColor: string;
} {
  switch (level) {
    case "cold":
      return {
        backgroundColor: colors.surface,
        textColor: colors.textTertiary,
        countColor: colors.textTertiary,
      };
    case "warm":
      return {
        backgroundColor: colors.accentGlow,
        textColor: colors.textSecondary,
        countColor: colors.textSecondary,
      };
    case "hot":
      return {
        backgroundColor: "rgba(232, 168, 56, 0.25)",
        textColor: colors.accent,
        countColor: colors.accent,
      };
    case "fire":
      return {
        backgroundColor: colors.accent,
        textColor: colors.bg,
        countColor: colors.bg,
      };
  }
}

function countSetsPerMuscle(
  history: WorkoutLogRow[],
  cycleState: CycleStateInput
): Record<MuscleGroup, number> {
  const counts: Record<MuscleGroup, number> = {
    chest: 0,
    shoulders: 0,
    biceps: 0,
    quads: 0,
    calves: 0,
    back: 0,
    triceps: 0,
    forearms: 0,
    glutes: 0,
    hamstrings: 0,
  };

  // Filter to workouts in the current week
  const thisWeekWorkouts = history.filter(
    (w) =>
      w.cycle === cycleState.cycle_number && w.week === cycleState.week_number
  );

  for (const workout of thisWeekWorkouts) {
    for (const exercise of workout.exercises) {
      const muscles = EXERCISE_MUSCLE_MAP[exercise.key];
      if (!muscles) continue;
      const setCount = exercise.sets.length;
      for (const muscle of muscles) {
        counts[muscle] += setCount;
      }
    }
  }

  return counts;
}

function MuscleCard({
  muscle,
  sets,
}: {
  muscle: MuscleGroup;
  sets: number;
}) {
  const level = getHeatLevel(sets);
  const heatStyles = getHeatStyles(level);

  return (
    <View
      style={[styles.muscleCard, { backgroundColor: heatStyles.backgroundColor }]}
    >
      <Text style={[styles.muscleName, { color: heatStyles.textColor }]}>
        {MUSCLE_LABELS[muscle]}
      </Text>
      <Text style={[styles.muscleCount, { color: heatStyles.countColor }]}>
        {sets}
      </Text>
    </View>
  );
}

export function MuscleHeatmap({ history, cycleState }: MuscleHeatmapProps) {
  const counts = countSetsPerMuscle(history, cycleState);

  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        {/* Front column */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>FRONT</Text>
          {FRONT_MUSCLES.map((muscle) => (
            <MuscleCard key={muscle} muscle={muscle} sets={counts[muscle]} />
          ))}
        </View>

        {/* Back column */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>BACK</Text>
          {BACK_MUSCLES.map((muscle) => (
            <MuscleCard key={muscle} muscle={muscle} sets={counts[muscle]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  columns: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  columnLabel: {
    color: colors.textTertiary,
    ...typography.caption,
    fontSize: 10,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  muscleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  muscleName: {
    ...typography.bodyBold,
    fontSize: 13,
  },
  muscleCount: {
    fontFamily: fonts.display,
    fontSize: 22,
  },
});
