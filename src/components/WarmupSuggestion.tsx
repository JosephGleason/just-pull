import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { WarmupSet } from "../hooks/useWarmup";
import { colors, typography, spacing, radius, fonts } from "../theme";

interface WarmupSuggestionProps {
  warmupSets: WarmupSet[];
  units: string;
  onDismiss: () => void;
}

export function WarmupSuggestion({
  warmupSets,
  units,
  onDismiss,
}: WarmupSuggestionProps) {
  if (warmupSets.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>WARM UP</Text>

      <View style={styles.list}>
        {warmupSets.map((set, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{set.label}</Text>
            <View style={styles.details}>
              <Text style={styles.weight}>{set.weight}</Text>
              <Text style={styles.unit}>{units}</Text>
              <Text style={styles.separator}> x </Text>
              <Text style={styles.reps}>{set.reps}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onDismiss}
        style={styles.skipButton}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip warmup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: colors.textSecondary,
    ...typography.bodyBold,
    fontSize: 13,
  },
  details: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  weight: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  unit: {
    color: colors.textTertiary,
    fontFamily: fonts.display,
    fontSize: 14,
    marginLeft: 2,
  },
  separator: {
    color: colors.textTertiary,
    ...typography.body,
    marginHorizontal: 2,
  },
  reps: {
    color: colors.textSecondary,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  skipButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  skipText: {
    color: colors.textTertiary,
    ...typography.bodyBold,
    fontSize: 13,
  },
});
