import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { WarmupSet } from "../hooks/useWarmup";
import { colors, typography, spacing, radius, fonts } from "../theme";
import { calculatePlates, formatPlatesPerSide } from "../utils/plates";

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

  const barWeight = units === "kg" ? 20 : 45;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>WARM UP</Text>

      <View style={styles.list}>
        {warmupSets.map((set, index) => {
          const plateText =
            set.weight > barWeight
              ? formatPlatesPerSide(calculatePlates(set.weight, units).plates)
              : "";
          return (
            <View key={index} style={styles.row}>
              <Text style={styles.label}>{set.label}</Text>
              <View>
                <View style={styles.details}>
                  <Text style={styles.weight}>{set.weight}</Text>
                  <Text style={styles.unit}>{units}</Text>
                  <Text style={styles.separator}> x </Text>
                  <Text style={styles.reps}>{set.reps}</Text>
                </View>
                {plateText ? (
                  <Text style={styles.plateText}>{plateText}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onDismiss}
        style={styles.skipButton}
        activeOpacity={0.7}
        accessibilityLabel="Skip warmup sets"
        accessibilityRole="button"
      >
        <Text style={styles.skipText}>Skip warmup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  list: {
    gap: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
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
  plateText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textAlign: "right" as const,
    marginTop: 2,
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
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
