import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSelector } from "@legendapp/state/react";
import { workouts$ } from "../../src/lib/store";
import { CalendarGrid } from "../../src/components/CalendarGrid";
import { WorkoutLogRow, ExerciseType } from "../../src/types";
import { colors, typography, spacing, radius } from "../../src/theme";

// Weight color indicates exercise type — matching ExerciseCard
function getWeightColor(type: ExerciseType): string {
  switch (type) {
    case "blue":
      return colors.accent;
    case "red":
      return colors.text;
    case "black":
      return colors.textSecondary;
  }
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const history = useMemo(() =>
    Object.values(workoutsRecord).sort((a, b) => a.date.localeCompare(b.date)),
    [workoutsRecord]
  );

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a set of ISO date strings from history
  const workoutDates = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const workout of history) {
      if (workout.date) set.add(workout.date);
    }
    return set;
  }, [history]);

  // Find the workout for the selected date (latest one if multiple on same day)
  const selectedWorkout = useMemo<WorkoutLogRow | null>(() => {
    if (!selectedDate) return null;
    const matches = history.filter((w) => w.date === selectedDate);
    if (matches.length === 0) return null;
    // Return the most recently completed one
    return matches[matches.length - 1];
  }, [selectedDate, history]);

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  function handleSelectDate(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  const totalSets = useMemo(() => {
    if (!selectedWorkout) return 0;
    return selectedWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }, [selectedWorkout]);

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyHistoryText}>
          Your workout history will appear here
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => router.navigate("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyCtaText}>Start Training</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
    >
      <CalendarGrid
        workoutDates={workoutDates}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        month={currentMonth}
        year={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Session detail panel */}
      {selectedDate === null ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyText}>Select a date to view details</Text>
        </View>
      ) : selectedWorkout === null ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyText}>No workout on this day</Text>
        </View>
      ) : (
        <View style={styles.sessionPanel}>
          {/* Session header */}
          <Text style={styles.sessionHeader}>
            Day {selectedWorkout.day} — Week {selectedWorkout.week}, Cycle{" "}
            {selectedWorkout.cycle}
          </Text>

          {/* Exercise list */}
          {selectedWorkout.exercises.map((ex, ei) => (
            <View
              key={ei}
              style={[
                styles.exerciseRow,
                ei < selectedWorkout.exercises.length - 1 && styles.exerciseRowBorder,
              ]}
            >
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <View style={styles.setsRow}>
                {ex.sets.map((s, si) => (
                  <Text key={si} style={[styles.setText, { color: getWeightColor(ex.type) }]}>
                    {s.weight} x {s.reps}
                    {s.is_amrap ? "*" : ""}
                    {s.is_pr ? " PR" : ""}
                    {si < ex.sets.length - 1 ? "  " : ""}
                  </Text>
                ))}
              </View>
            </View>
          ))}

          {/* Totals */}
          <Text style={styles.totalText}>
            {totalSets} set{totalSets !== 1 ? "s" : ""} total
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyHistoryText: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: "center",
  },
  emptyCta: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyCtaText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
  },
  emptyPanel: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  sessionPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sessionHeader: {
    color: colors.text,
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  exerciseRow: {
    paddingVertical: spacing.sm,
  },
  exerciseRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  exerciseName: {
    color: colors.text,
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  setsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: spacing.xs,
  },
  setText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  totalText: {
    color: colors.textTertiary,
    ...typography.micro,
    marginTop: spacing.sm,
    textAlign: "right",
  },
});
