import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { ExerciseLog, ExerciseType } from "../types";
import { colors, typography, spacing, radius } from "../theme";

interface WorkoutSummaryProps {
  exercises: ExerciseLog[];
  prsHit: string[];
  onFinish: () => void;
  onDiscard: () => void;
}

export function WorkoutSummary({
  exercises,
  prsHit,
  onFinish,
  onDiscard,
}: WorkoutSummaryProps) {
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const handleDiscard = () => {
    Alert.alert(
      "Discard Workout",
      "Are you sure? All progress from this session will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: onDiscard },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Checkmark */}
      <Text style={styles.checkmark}>✓</Text>

      <Text style={styles.header}>Workout Complete</Text>

      {/* PR celebration */}
      {prsHit.length > 0 && (
        <View style={styles.prSection}>
          <Text style={styles.prTitle}>New PRs</Text>
          {prsHit.map((name) => (
            <Text key={name} style={styles.prItem}>
              {name}
            </Text>
          ))}
        </View>
      )}

      {/* Exercise summary */}
      <View style={styles.exerciseList}>
        {exercises.map((ex) => (
          <View key={ex.key} style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.exerciseSets}>
              {ex.sets.length} {ex.sets.length === 1 ? "set" : "sets"}
            </Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <Text style={styles.totalSets}>
        {totalSets} total {totalSets === 1 ? "set" : "sets"}
      </Text>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.finishButton}
        onPress={onFinish}
        activeOpacity={0.8}
      >
        <Text style={styles.finishButtonText}>Finish</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.discardButton}
        onPress={handleDiscard}
        activeOpacity={0.8}
      >
        <Text style={styles.discardButtonText}>Discard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    alignItems: "center",
  },
  checkmark: {
    fontSize: 56,
    color: colors.green,
    marginBottom: spacing.md,
  },
  header: {
    color: colors.text,
    ...typography.title,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  prSection: {
    backgroundColor: colors.accentGlow,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    alignSelf: "stretch",
  },
  prTitle: {
    color: colors.accent,
    ...typography.subtitle,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  prItem: {
    color: colors.text,
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  exerciseList: {
    alignSelf: "stretch",
    marginBottom: spacing.md,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseName: {
    color: colors.text,
    ...typography.bodyBold,
  },
  exerciseSets: {
    color: colors.textSecondary,
    ...typography.micro,
  },
  totalSets: {
    color: colors.textSecondary,
    ...typography.body,
    marginBottom: spacing.xl,
  },
  finishButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignSelf: "stretch",
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  finishButtonText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
  },
  discardButton: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  discardButtonText: {
    color: colors.red,
    ...typography.body,
  },
});
