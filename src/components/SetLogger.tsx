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

  return (
    <View style={styles.container}>
      {/* Set counter */}
      <View style={styles.setCounterRow}>
        {isPrAttempt && (
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>PR</Text>
          </View>
        )}
        <Text style={styles.setCounter}>
          SET {setNumber} OF {totalSets}
        </Text>
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
          style={styles.weightButton}
          activeOpacity={0.7}
        >
          <Text style={styles.weightButtonText}>-</Text>
        </TouchableOpacity>

        <View style={[styles.weightDisplay, isPrAttempt && styles.weightDisplayPr]}>
          <Text style={[styles.weightValue, isPrAttempt && styles.weightValuePr]}>
            {currentWeight}
            <Text style={styles.weightUnitInline}> {units}</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleWeightChange(increment)}
          style={styles.weightButton}
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
        <Text style={styles.completeButtonText}>LOG SET</Text>
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
    ...typography.caption,
  },
  exerciseName: {
    color: colors.text,
    ...typography.title,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  prBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: spacing.sm,
  },
  prBadgeText: {
    color: colors.bg,
    ...typography.caption,
    letterSpacing: 0.5,
  },
  previousPerformance: {
    color: colors.textTertiary,
    ...typography.micro,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  weightButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 26,
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  weightButtonText: {
    color: colors.accent,
    fontSize: 24,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  weightDisplay: {
    alignItems: "center",
    marginHorizontal: spacing.xl,
    minWidth: 140,
  },
  weightDisplayPr: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  weightValue: {
    color: colors.text,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 64,
  },
  weightValuePr: {
    color: colors.accent,
  },
  weightUnitInline: {
    color: colors.textTertiary,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 28,
  },
  amrapHint: {
    color: colors.accent,
    ...typography.micro,
    marginBottom: spacing.xs,
    marginTop: -spacing.xs,
  },
  repsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  repsButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  repsButtonText: {
    color: colors.accent,
    fontSize: 22,
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    borderRadius: 14,
    height: 64,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});
