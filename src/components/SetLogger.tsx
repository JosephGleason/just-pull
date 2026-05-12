import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { ExerciseType, SetLog } from "../types";

const TYPE_COLORS: Record<ExerciseType, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  black: "#A3A3A3",
};

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
  const borderColor = TYPE_COLORS[exerciseType];
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

  const weightLabel = isChinups ? "Added Weight" : "Weight";

  // Weight +/- buttons are more prominent for AMRAP (drop sets) than compounds
  const weightButtonSize = isAmrap ? 52 : 48;

  return (
    <View style={styles.container}>
      {/* Exercise name */}
      <Text style={[styles.exerciseName, { color: borderColor }]}>
        {exerciseName}
      </Text>

      {/* Set subtitle */}
      <Text style={styles.setSubtitle}>
        Set {setNumber} of {totalSets}
      </Text>

      {/* PR badge */}
      {isPrAttempt && (
        <View style={styles.prBadge}>
          <Text style={styles.prBadgeText}>PR ATTEMPT</Text>
        </View>
      )}

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
      <Text style={styles.sectionLabel}>Reps</Text>
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
        <Text style={styles.completeButtonText}>COMPLETE SET</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  setSubtitle: {
    fontSize: 16,
    color: "#A3A3A3",
    marginBottom: 12,
  },
  prBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  prBadgeText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  previousPerformance: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  weightButton: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  weightButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  weightDisplay: {
    alignItems: "center",
    marginHorizontal: 24,
    minWidth: 120,
  },
  weightValue: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "800",
  },
  weightUnit: {
    color: "#666666",
    fontSize: 14,
    marginTop: -4,
  },
  amrapHint: {
    fontSize: 13,
    color: "#A3A3A3",
    marginBottom: 4,
    marginTop: -4,
  },
  repsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  repsButton: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  repsButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  repsInput: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "800",
    textAlign: "center",
    minWidth: 100,
    marginHorizontal: 16,
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 48,
    alignSelf: "stretch",
    alignItems: "center",
    minHeight: 64,
    justifyContent: "center",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
