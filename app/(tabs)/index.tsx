import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppContext } from "../../src/context";
import { getProgramDay, getSetsForWeek } from "../../src/program";
import { getTargetWeight } from "../../src/hooks/useWorkout";
import { calculateNutrition } from "../../src/hooks/useNutrition";
import { ExerciseCard } from "../../src/components/ExerciseCard";
import { NutritionCard } from "../../src/components/NutritionCard";

export default function TodayScreen() {
  const router = useRouter();
  const { settings, cycleState, weights, currentSession, isLoading } =
    useAppContext();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!cycleState || !settings) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Set up your weights in Settings to get started.
        </Text>
      </View>
    );
  }

  const programDay = getProgramDay(cycleState.nextDay);
  const nutritionTargets =
    settings.nutrition
      ? calculateNutrition(settings.nutrition, settings.units)
      : null;

  const isChinupsKey = (key: string) => key.startsWith("chinups");

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Resume Workout Banner */}
        {currentSession && (
          <TouchableOpacity
            style={styles.resumeBanner}
            onPress={() => router.push("/workout")}
            activeOpacity={0.8}
          >
            <Text style={styles.resumeText}>
              Workout in progress — Resume?
            </Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            Day {cycleState.nextDay} — Week {cycleState.weekNumber}, Cycle{" "}
            {cycleState.cycleNumber}
          </Text>
          {cycleState.isDeload && (
            <View style={styles.deloadBadge}>
              <Text style={styles.deloadText}>Deload Cycle</Text>
            </View>
          )}
        </View>

        {/* Exercise List */}
        {programDay.exercises.map((exercise) => {
          const sets = getSetsForWeek(
            exercise,
            cycleState.weekNumber,
            cycleState.isDeload
          );
          const weight = getTargetWeight(exercise.key, weights, cycleState);
          const isResting = sets === 0;

          return (
            <ExerciseCard
              key={exercise.key}
              name={exercise.name}
              sets={sets}
              reps={exercise.reps}
              weight={weight}
              type={exercise.type}
              isResting={isResting}
              units={settings.units}
              isChinups={isChinupsKey(exercise.key)}
            />
          );
        })}

        {/* Nutrition Card */}
        {nutritionTargets && <NutritionCard targets={nutritionTargets} />}
      </ScrollView>

      {/* Start Workout Button */}
      {!currentSession && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push("/workout")}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resumeBanner: {
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  resumeText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  deloadBadge: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  deloadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  startButton: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
});
