import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAppContext } from "../../src/context";
import { CalendarGrid } from "../../src/components/CalendarGrid";
import { WorkoutLog, ExerciseType } from "../../src/types";
import { colors, typography, spacing, radius } from "../../src/theme";

const TYPE_DOT_COLORS: Record<ExerciseType, string> = {
  red: colors.orange,
  blue: colors.accent,
  black: "#8E8E93",
};

export default function HistoryScreen() {
  const { history } = useAppContext();

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
  const selectedWorkout = useMemo<WorkoutLog | null>(() => {
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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
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
            <View key={ei} style={styles.exerciseCard}>
              <View style={styles.exerciseNameRow}>
                <View style={[styles.typeDot, { backgroundColor: TYPE_DOT_COLORS[ex.type] }]} />
                <Text style={styles.exerciseName}>{ex.name}</Text>
              </View>
              <View style={styles.setsRow}>
                {ex.sets.map((s, si) => (
                  <Text key={si} style={styles.setText}>
                    {s.weight} x {s.reps}
                    {s.isAmrap ? "*" : ""}
                    {s.isPr ? " PR" : ""}
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
    padding: spacing.md,
  },
  sessionHeader: {
    color: colors.text,
    ...typography.title3,
    marginBottom: spacing.md,
  },
  exerciseCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  exerciseName: {
    color: colors.text,
    ...typography.bodyBold,
  },
  setsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: spacing.md,
  },
  setText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  totalText: {
    color: colors.textTertiary,
    ...typography.caption1,
    marginTop: spacing.sm,
    textAlign: "right",
  },
});
