import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { ExerciseType, SetLog } from "../types";
import { colors, typography, spacing, radius } from "../theme";

interface SetLoggerProps {
  exerciseName: string;
  exerciseKey: string;
  exerciseType: ExerciseType;
  setNumber: number;
  totalSets: number;
  targetReps: number;
  weight: number;
  isPrAttempt: boolean;
  previousPerformance: string | null;
  units: string;
  isChinups: boolean;
  onComplete: (set: SetLog) => void;
  onWeightChange: (newWeight: number) => void;
}

export function SetLogger({
  exerciseName,
  exerciseKey,
  exerciseType,
  setNumber,
  totalSets,
  targetReps,
  weight,
  isPrAttempt,
  previousPerformance,
  units,
  isChinups,
  onComplete,
  onWeightChange,
}: SetLoggerProps) {
  const [currentWeight, setCurrentWeight] = useState(weight);
  const [reps, setReps] = useState(String(targetReps));

  const isAmrap = exerciseType === "black";
  const increment = exerciseType === "black" ? 5 : 2.5;

  const handleWeightChange = (delta: number) => {
    const newWeight = Math.max(0, currentWeight + delta);
    setCurrentWeight(newWeight);
    onWeightChange(newWeight);
  };

  const handleComplete = () => {
    const parsedReps = parseInt(reps, 10) || 0;
    onComplete({
      weight: currentWeight,
      reps: parsedReps,
      isAmrap,
      isPr: isPrAttempt,
    });
  };

  const weightLabel = isChinups ? "ADDED WEIGHT" : "WEIGHT";

  const weightButtonSize = isAmrap ? 52 : 44;

  return (
    <View style={styles.container}>
      {/* Set counter */}
      <View style={styles.setCounterRow}>
        <Text style={styles.setCounter}>
          SET {setNumber} OF {totalSets}
        </Text>
        {isPrAttempt && (
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>PR</Text>
          </View>
        )}
      </View>

      {/* Exercise name */}
      <Text style={styles.exerciseName}>{exerciseName}</Text>

      {/* Previous performance */}
      {previousPerformance && (
        <Text style={styles.previousPerformance}>{previousPerformance}</Text>
      )}

      {/* Weight display */}
      <Text style={styles.sectionLabel}>{weightLabel}</Text>
      <View style={styles.weightRow}>
        <TouchableOpacity
          onPress={() => handleWeightChange(-increment)}
          style={[
            styles.weightButton,
            { width: weightButtonSize, height: weightButtonSize },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.weightButtonText}>-</Text>
        </TouchableOpacity>

        <View style={styles.weightDisplay}>
          <Text style={styles.weightValue}>{currentWeight}</Text>
          <Text style={styles.weightUnit}>{units}</Text>
        </View>

        <TouchableOpacity
          onPress={() => handleWeightChange(increment)}
          style={[
            styles.weightButton,
            { width: weightButtonSize, height: weightButtonSize },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.weightButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Reps input */}
      <Text style={styles.sectionLabel}>REPS</Text>
      {isAmrap && (
        <Text style={styles.amrapHint}>AMRAP (~{targetReps})</Text>
      )}
      <View style={styles.repsRow}>
        <TouchableOpacity
          onPress={() =>
            setReps(String(Math.max(0, (parseInt(reps, 10) || 0) - 1)))
          }
          style={styles.repsButton}
          activeOpacity={0.7}
        >
          <Text style={styles.repsButtonText}>-</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.repsInput}
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          selectTextOnFocus
          maxLength={3}
        />

        <TouchableOpacity
          onPress={() =>
            setReps(String((parseInt(reps, 10) || 0) + 1))
          }
          style={styles.repsButton}
          activeOpacity={0.7}
        >
          <Text style={styles.repsButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Complete Set button */}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={handleComplete}
        activeOpacity={0.8}
      >
        <Text style={styles.completeButtonText}>Complete Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: "center",
  },
  setCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  setCounter: {
    color: colors.textSecondary,
    ...typography.caption2,
  },
  exerciseName: {
    color: colors.text,
    ...typography.title1,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  prBadge: {
    backgroundColor: colors.teal,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  prBadgeText: {
    color: colors.bg,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  previousPerformance: {
    color: colors.textTertiary,
    ...typography.caption1,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.textSecondary,
    ...typography.caption2,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  weightButton: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  weightButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "600",
  },
  weightDisplay: {
    alignItems: "center",
    marginHorizontal: spacing.xl,
    minWidth: 120,
  },
  weightValue: {
    color: colors.text,
    ...typography.displayLarge,
  },
  weightUnit: {
    color: colors.textTertiary,
    ...typography.caption1,
    marginTop: -2,
  },
  amrapHint: {
    color: colors.orange,
    ...typography.caption1,
    marginBottom: spacing.xs,
    marginTop: -spacing.xs,
  },
  repsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  repsButton: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  repsButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "600",
  },
  repsInput: {
    color: colors.text,
    ...typography.displayMedium,
    textAlign: "center",
    minWidth: 100,
    marginHorizontal: spacing.md,
  },
  completeButton: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignSelf: "stretch",
    alignItems: "center",
    minHeight: 60,
    justifyContent: "center",
  },
  completeButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
