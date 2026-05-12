import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ExerciseType } from "../types";

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

const TYPE_COLORS: Record<ExerciseType, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  black: "#A3A3A3",
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
  const borderColor = TYPE_COLORS[type];

  if (isResting) {
    return (
      <View style={[styles.card, styles.restingCard, { borderLeftColor: borderColor }]}>
        <Text style={styles.restingName}>{name}</Text>
        <Text style={styles.restingLabel}>Rest this week</Text>
      </View>
    );
  }

  const weightLabel = isChinups
    ? `+${weight}${units} added`
    : `${weight}${units}`;

  const repsLabel = type === "black" ? `AMRAP (~${reps})` : `${reps}`;

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.weight}>{weightLabel}</Text>
      </View>
      <Text style={styles.details}>
        {sets} sets x {repsLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  restingCard: {
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  weight: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  details: {
    color: "#A3A3A3",
    fontSize: 14,
  },
  restingName: {
    color: "#666666",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  restingLabel: {
    color: "#666666",
    fontSize: 14,
    fontStyle: "italic",
  },
});
