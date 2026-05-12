import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ExerciseType } from "../types";
import { colors, typography, spacing, radius } from "../theme";

interface ExerciseCardProps {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  type: ExerciseType;
  isResting: boolean;
  units: string;
  isChinups: boolean;
}

const TYPE_DOT_COLORS: Record<ExerciseType, string> = {
  red: colors.orange,
  blue: colors.accent,
  black: "#8E8E93",
};

export function ExerciseCard({
  name,
  sets,
  reps,
  weight,
  type,
  isResting,
  units,
  isChinups,
}: ExerciseCardProps) {
  const dotColor = TYPE_DOT_COLORS[type];

  if (isResting) {
    return (
      <View style={[styles.card, styles.restingCard]}>
        <View style={styles.nameRow}>
          <View style={[styles.typeDot, { backgroundColor: dotColor }]} />
          <Text style={styles.restingName}>{name}</Text>
        </View>
        <Text style={styles.restingLabel}>Rest this week</Text>
      </View>
    );
  }

  const weightLabel = isChinups
    ? `+${weight}${units}`
    : `${weight}${units}`;

  const isAmrap = type === "black";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={[styles.typeDot, { backgroundColor: dotColor }]} />
          <Text style={styles.name}>{name}</Text>
          {isAmrap && (
            <View style={styles.amrapBadge}>
              <Text style={styles.amrapBadgeText}>AMRAP</Text>
            </View>
          )}
        </View>
        <Text style={styles.weight}>{weightLabel}</Text>
      </View>
      <Text style={styles.details}>
        {sets} sets x {isAmrap ? `~${reps}` : reps}
      </Text>
      {isChinups && (
        <Text style={styles.addedWeightLabel}>Added Weight</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  restingCard: {
    opacity: 0.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  name: {
    color: colors.text,
    ...typography.title3,
  },
  weight: {
    color: colors.text,
    ...typography.title1,
  },
  details: {
    color: colors.textSecondary,
    fontSize: 15,
    marginLeft: 16,
  },
  addedWeightLabel: {
    color: colors.textTertiary,
    ...typography.caption2,
    marginLeft: 16,
    marginTop: spacing.xs,
  },
  amrapBadge: {
    backgroundColor: "rgba(255, 159, 10, 0.15)",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  amrapBadgeText: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  restingName: {
    color: colors.textTertiary,
    ...typography.title3,
  },
  restingLabel: {
    color: colors.textTertiary,
    ...typography.caption1,
    marginLeft: 16,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
});
