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

const TYPE_COLORS: Record<ExerciseType, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  black: "#A3A3A3",
};

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
      <Text style={styles.header}>Workout Complete!</Text>

      {/* PR celebration */}
      {prsHit.length > 0 && (
        <View style={styles.prSection}>
          <Text style={styles.prTitle}>New PRs!</Text>
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
          <View
            key={ex.key}
            style={[styles.exerciseRow, { borderLeftColor: TYPE_COLORS[ex.type] }]}
          >
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 24,
    textAlign: "center",
  },
  prSection: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  prTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 8,
    textAlign: "center",
  },
  prItem: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  exerciseList: {
    alignSelf: "stretch",
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  exerciseSets: {
    fontSize: 14,
    color: "#A3A3A3",
  },
  totalSets: {
    fontSize: 16,
    color: "#A3A3A3",
    marginBottom: 32,
  },
  finishButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 16,
    paddingVertical: 18,
    alignSelf: "stretch",
    alignItems: "center",
    minHeight: 60,
    justifyContent: "center",
    marginBottom: 12,
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  discardButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    paddingVertical: 14,
    alignSelf: "stretch",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  discardButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
});
