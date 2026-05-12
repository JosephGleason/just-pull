import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAppContext } from "../../src/context";
import { CalendarGrid } from "../../src/components/CalendarGrid";
import { WorkoutLog, ExerciseType } from "../../src/types";

const TYPE_COLORS: Record<ExerciseType, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  black: "#A3A3A3",
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
            <View key={ei} style={[styles.exerciseCard, { borderLeftColor: TYPE_COLORS[ex.type] }]}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <View style={styles.setsRow}>
                {ex.sets.map((s, si) => (
                  <View key={si} style={styles.setChip}>
                    <Text style={styles.setChipText}>
                      {s.weight} × {s.reps}
                      {s.isAmrap ? "*" : ""}
                      {s.isPr ? " PR" : ""}
                    </Text>
                  </View>
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
    backgroundColor: "#000",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyPanel: {
    alignItems: "center",
    marginTop: 24,
  },
  emptyText: {
    color: "#666",
    fontSize: 15,
  },
  sessionPanel: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
  },
  sessionHeader: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  exerciseCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  setsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  setChip: {
    backgroundColor: "#2A2A2A",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  setChipText: {
    color: "#E0E0E0",
    fontSize: 13,
    fontWeight: "500",
  },
  totalText: {
    color: "#666",
    fontSize: 13,
    marginTop: 10,
    textAlign: "right",
  },
});
