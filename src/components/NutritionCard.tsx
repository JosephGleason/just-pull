import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NutritionTargets } from "../types";

interface NutritionCardProps {
  targets: NutritionTargets;
}

export function NutritionCard({ targets }: NutritionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Daily Targets</Text>
      <Text style={styles.calories}>{targets.calories}</Text>
      <Text style={styles.caloriesUnit}>calories</Text>
      <View style={styles.macros}>
        <View style={[styles.pill, { backgroundColor: "#166534" }]}>
          <Text style={styles.pillValue}>{targets.protein}g</Text>
          <Text style={styles.pillLabel}>Protein</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: "#9A3412" }]}>
          <Text style={styles.pillValue}>{targets.carbs}g</Text>
          <Text style={styles.pillLabel}>Carbs</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: "#1E40AF" }]}>
          <Text style={styles.pillValue}>{targets.fat}g</Text>
          <Text style={styles.pillLabel}>Fat</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  label: {
    color: "#A3A3A3",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  calories: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
  },
  caloriesUnit: {
    color: "#A3A3A3",
    fontSize: 14,
    marginBottom: 16,
  },
  macros: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 90,
  },
  pillValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  pillLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 2,
  },
});
