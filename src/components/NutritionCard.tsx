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
        <Text style={styles.caloriesUnit}>kcal</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.macros}>
        <View style={styles.macroCol}>
          <Text style={[styles.macroValue, { color: colors.green }]}>
            {targets.protein}g
          </Text>
          <Text style={styles.macroLabel}>PROTEIN</Text>
        </View>
        <View style={styles.macroCol}>
          <Text style={[styles.macroValue, { color: colors.accent }]}>
            {targets.carbs}g
          </Text>
          <Text style={styles.macroLabel}>CARBS</Text>
        </View>
        <View style={styles.macroCol}>
          <Text style={[styles.macroValue, { color: colors.accentDim }]}>
            {targets.fat}g
          </Text>
          <Text style={styles.macroLabel}>FAT</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    ...typography.caption,
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
    marginLeft: spacing.sm,
  },
  separator: {
    height: 1,
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
    ...typography.displaySmall,
    marginBottom: spacing.xs,
  },
  macroLabel: {
    color: colors.textSecondary,
    ...typography.caption,
  },
});
