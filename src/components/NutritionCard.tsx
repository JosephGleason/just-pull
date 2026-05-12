import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NutritionTargets } from "../types";
import { colors, typography, spacing, radius } from "../theme";

interface NutritionCardProps {
  targets: NutritionTargets;
}

export function NutritionCard({ targets }: NutritionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>DAILY NUTRITION</Text>
      <View style={styles.calorieRow}>
        <Text style={styles.calories}>{targets.calories}</Text>
        <Text style={styles.caloriesUnit}> kcal</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.macros}>
        <View style={styles.macroCol}>
          <Text style={[styles.macroValue, { color: colors.green }]}>
            {targets.protein}g
          </Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroCol}>
          <Text style={[styles.macroValue, { color: colors.orange }]}>
            {targets.carbs}g
          </Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroCol}>
          <Text style={[styles.macroValue, { color: colors.accent }]}>
            {targets.fat}g
          </Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>
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
  label: {
    color: colors.textSecondary,
    ...typography.caption2,
    marginBottom: spacing.sm,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  calories: {
    color: colors.text,
    ...typography.displayLarge,
  },
  caloriesUnit: {
    color: colors.textSecondary,
    ...typography.body,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: spacing.md,
  },
  macros: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroCol: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  macroLabel: {
    color: colors.textSecondary,
    ...typography.caption2,
  },
});
