import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSelector } from "@legendapp/state/react";
import { workouts$, profile$ } from "../../src/lib/store";
import { CalendarGrid } from "../../src/components/CalendarGrid";
import { WorkoutLogRow } from "../../src/types";
import { colors, fonts, forgeStyles } from "../../src/theme";

const MONTH_NAMES_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const MONTH_NAMES_FULL = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

const DAY_LABELS: Record<number, string> = {
  1: "Day 1 — Pull",
  2: "Day 2 — Push",
  3: "Day 3 — Legs/Shoulders",
  5: "Day 5 — Upper",
  6: "Day 6 — Lower/Shoulders",
};

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (isNaN(start) || isNaN(end)) return "—";
  const mins = Math.round((end - start) / 60000);
  if (mins <= 0) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTH_NAMES_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const profile = useSelector(profile$) as { units: string } | undefined;
  const units = (profile?.units ?? "lb").toUpperCase();
  const history = useMemo(
    () => Object.values(workoutsRecord).sort((a, b) => a.date.localeCompare(b.date)),
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

  // Build PR dates set
  const prDates = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const workout of history) {
      for (const ex of workout.exercises) {
        for (const s of ex.sets) {
          if (s.is_pr) {
            set.add(workout.date);
            break;
          }
        }
      }
    }
    return set;
  }, [history]);

  // Find the workout for the selected date
  const selectedWorkout = useMemo<WorkoutLogRow | null>(() => {
    if (!selectedDate) return null;
    const matches = history.filter((w) => w.date === selectedDate);
    if (matches.length === 0) return null;
    return matches[matches.length - 1];
  }, [selectedDate, history]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthWorkouts = history.filter((w) => w.date.startsWith(monthStr));
    const sessions = monthWorkouts.length;
    let totalVolume = 0;
    let totalPRs = 0;
    for (const w of monthWorkouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          totalVolume += s.weight * s.reps;
          if (s.is_pr) totalPRs++;
        }
      }
    }
    return { sessions, volume: totalVolume, prs: totalPRs };
  }, [history, currentMonth, currentYear]);

  // Session list for current month (reverse chronological)
  const monthSessions = useMemo(() => {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    return history
      .filter((w) => w.date.startsWith(monthStr))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [history, currentMonth, currentYear]);

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

  function formatVolume(v: number): string {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return String(v);
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyLabel}>HISTORY</Text>
        <Text style={styles.emptyMessage}>
          Your workout history will appear here
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => router.navigate("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyCtaText}>START TRAINING</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
  const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
    >
      {/* Header slab */}
      <View style={styles.headerSlab}>
        <View style={styles.headerLeft}>
          <Text style={forgeStyles.fLabel}>HISTORY</Text>
          <Text style={forgeStyles.fDisplay}>
            {MONTH_NAMES_FULL[currentMonth].slice(0, 3)} {currentYear}
            <Text style={forgeStyles.accentDot}>.</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Previous month"
            accessibilityRole="button"
          >
            <Text style={styles.monthNav}>
              {"◂"} {MONTH_NAMES_SHORT[prevMonthIdx]}
            </Text>
          </TouchableOpacity>
          <Text style={styles.monthNavSep}> {"·"} </Text>
          <TouchableOpacity
            onPress={handleNextMonth}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Next month"
            accessibilityRole="button"
          >
            <Text style={styles.monthNav}>
              {MONTH_NAMES_SHORT[nextMonthIdx]} {"▸"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      <CalendarGrid
        workoutDates={workoutDates}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        month={currentMonth}
        year={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        prDates={prDates}
      />

      {/* Glance stats */}
      <View style={styles.glanceStats}>
        <View style={[styles.glanceStat, styles.glanceStatBorder]}>
          <Text style={styles.glanceStatLabel}>SESSIONS</Text>
          <Text style={styles.glanceStatNum}>{monthStats.sessions}</Text>
          <Text style={styles.glanceStatSub}>THIS MONTH</Text>
        </View>
        <View style={[styles.glanceStat, styles.glanceStatBorder]}>
          <Text style={styles.glanceStatLabel}>VOLUME</Text>
          <Text style={styles.glanceStatNum}>{formatVolume(monthStats.volume)}</Text>
          <Text style={styles.glanceStatSub}>TOTAL {units}</Text>
        </View>
        <View style={styles.glanceStat}>
          <Text style={styles.glanceStatLabel}>PRS</Text>
          <Text style={styles.glanceStatNum}>{monthStats.prs}</Text>
          <Text style={styles.glanceStatSub}>RECORDS</Text>
        </View>
      </View>

      {/* Session list */}
      <View style={styles.sessionList}>
        {monthSessions.map((workout) => {
          const totalSets = workout.exercises.reduce(
            (acc, ex) => acc + ex.sets.length,
            0
          );
          const hasPR = workout.exercises.some((ex) =>
            ex.sets.some((s) => s.is_pr)
          );
          const liftNames = workout.exercises
            .map((ex) => ex.name)
            .slice(0, 3)
            .join(", ");
          const dayLabel =
            DAY_LABELS[workout.day] ?? `Day ${workout.day}`;
          const duration = workout.completed_at
            ? formatDuration(workout.created_at, workout.completed_at)
            : "—";

          return (
            <TouchableOpacity
              key={workout.id}
              style={styles.sessionRow}
              onPress={() => handleSelectDate(workout.date)}
              activeOpacity={0.7}
            >
              <View style={styles.sessionDate}>
                <Text style={styles.sessionDateText}>
                  {formatDateLabel(workout.date)}
                </Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDayLabel}>{dayLabel}</Text>
                <Text style={styles.sessionDetails} numberOfLines={1}>
                  {totalSets} sets {"·"} {duration} {"·"} {liftNames}
                </Text>
              </View>
              <View style={styles.sessionRight}>
                {hasPR && (
                  <View style={styles.prBadge}>
                    <Text style={styles.prBadgeText}>PR</Text>
                  </View>
                )}
                <Text style={styles.chevron}>{"▸"}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Session detail panel */}
      {selectedDate !== null && selectedWorkout !== null && (
        <View style={styles.detailPanel}>
          <Text style={styles.detailHeader}>
            Day {selectedWorkout.day} {"·"} Week {selectedWorkout.week} {"·"}{" "}
            Cycle {selectedWorkout.cycle}
          </Text>

          {selectedWorkout.exercises.map((ex, ei) => (
            <View
              key={ei}
              style={[
                styles.detailExercise,
                ei < selectedWorkout.exercises.length - 1 &&
                  styles.detailExerciseBorder,
              ]}
            >
              <Text style={styles.detailExName}>{ex.name}</Text>
              <View style={styles.detailSets}>
                {ex.sets.map((s, si) => (
                  <Text key={si} style={styles.detailSetText}>
                    {s.failed ? "✗" : ""}{s.weight}{"×"}{s.reps}
                    {s.is_amrap ? "*" : ""}
                    {s.is_pr ? (
                      <Text style={styles.detailPR}> PR</Text>
                    ) : null}
                    {si < ex.sets.length - 1 ? "  " : ""}
                  </Text>
                ))}
              </View>
            </View>
          ))}
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
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: "center",
  },
  emptyCta: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 0,
    marginTop: 20,
  },
  emptyCtaText: {
    color: colors.textInverse,
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },

  // Header slab
  headerSlab: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 6,
  },
  monthNav: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSecondary,
  },
  monthNavSep: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Glance stats
  glanceStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  glanceStat: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  glanceStatBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  glanceStatLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  glanceStatNum: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 44,
    color: colors.text,
  },
  glanceStatSub: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },

  // Session list
  sessionList: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  sessionDate: {
    width: 60,
  },
  sessionDateText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },
  sessionInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  sessionDayLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text,
  },
  sessionDetails: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  sessionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prBadge: {
    borderWidth: 1,
    borderColor: colors.pr,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 0,
  },
  prBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.pr,
    letterSpacing: 2,
  },
  chevron: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textTertiary,
  },

  // Detail panel
  detailPanel: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  detailHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  detailExercise: {
    paddingVertical: 8,
  },
  detailExerciseBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  detailExName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  detailSets: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailSetText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailPR: {
    color: colors.pr,
    fontFamily: fonts.monoBold,
  },
});
