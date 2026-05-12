import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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

// Weight color indicates exercise type — no dots, no borders
function getWeightColor(type: ExerciseType): string {
  switch (type) {
    case "blue":
      return colors.accent; // amber for heavy compound
    case "red":
      return colors.text; // warm white for compound
    case "black":
      return colors.textSecondary; // muted for AMRAP
  }
}

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
  const isCompound = type === "blue" || type === "red";

  if (isResting) {
    return (
      <Pressable style={({ pressed }) => [styles.card, styles.restingCard, pressed && styles.cardPressed]}>
        <View style={styles.header}>
          <View style={styles.nameCol}>
            <Text style={styles.restingName}>{name}</Text>
          </View>
          <Text style={styles.restingLabel}>Rest this week</Text>
        </View>
      </Pressable>
    );
  }

  const weightLabel = isChinups
    ? `+${weight}${units}`
    : `${weight}${units}`;

  const isAmrap = type === "black";
  const weightColor = getWeightColor(type);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.header}>
        <View style={styles.nameCol}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.details}>
            {sets} sets x {isAmrap ? `~${reps}` : reps}
            {isChinups ? "  added weight" : ""}
          </Text>
        </View>
        <View style={styles.weightCol}>
          {isAmrap && (
            <Text style={styles.amrapLabel}>AMRAP</Text>
          )}
          <Text style={[isCompound ? styles.weight : styles.weightSmall, { color: weightColor }]}>{weightLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: 12,
  },
  cardPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  restingCard: {
    opacity: 0.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    color: colors.text,
    ...typography.subtitle,
  },
  details: {
    color: colors.textSecondary,
    ...typography.body,
    marginTop: spacing.xs,
  },
  weightCol: {
    alignItems: "flex-end",
  },
  weight: {
    ...typography.displayLarge,
  },
  weightSmall: {
    ...typography.displaySmall,
  },
  amrapLabel: {
    color: colors.accent,
    ...typography.caption,
    marginBottom: 2,
  },
  restingName: {
    color: colors.textTertiary,
    ...typography.subtitle,
    textDecorationLine: "line-through",
  },
  restingLabel: {
    color: colors.textTertiary,
    ...typography.micro,
    fontStyle: "italic",
  },
});
