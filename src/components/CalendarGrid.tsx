import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts } from "../theme";

interface CalendarGridProps {
  workoutDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  prDates?: Set<string>;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];


function toISODate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function getTodayISO(): string {
  const now = new Date();
  return toISODate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function CalendarGrid({
  workoutDates,
  selectedDate,
  onSelectDate,
  month,
  year,
  onPrevMonth,
  onNextMonth,
  prDates,
}: CalendarGridProps) {
  const today = useMemo(() => getTodayISO(), []);

  // First day of month — adjust for Monday start (0=Mon, 6=Sun)
  const firstDayJS = new Date(year, month, 1).getDay(); // 0=Sun
  const firstDayMon = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayMon; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Split into weeks
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View>
      {/* Weekday header */}
      <View style={styles.weekdayRow}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.gridContainer}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (day === null) {
                return (
                  <View key={di} style={[styles.dayCell, styles.emptyCell]}>
                    <View style={styles.dayCellInner} />
                  </View>
                );
              }

              const isoDate = toISODate(year, month, day);
              const hasWorkout = workoutDates.has(isoDate);
              const isToday = isoDate === today;
              const isPR = prDates?.has(isoDate) ?? false;
              const isFuture = isoDate > today;
              const isSelected = selectedDate === isoDate;

              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.dayCell,
                    hasWorkout && !isToday && styles.workoutCell,
                    isToday && styles.todayCell,
                    isSelected && !isToday && styles.selectedCell,
                  ]}
                  onPress={() => onSelectDate(isoDate)}
                  activeOpacity={0.7}
                  accessibilityLabel={`${day}, ${hasWorkout ? "workout day" : ""}${isToday ? " today" : ""}${isPR ? " PR" : ""}`}
                  accessibilityRole="button"
                >
                  <View style={styles.dayCellInner}>
                    <Text
                      style={[
                        styles.dayText,
                        hasWorkout && !isToday && styles.workoutDayText,
                        isToday && styles.todayText,
                        isFuture && styles.futureText,
                      ]}
                    >
                      {day}
                    </Text>
                    {isPR && <View style={styles.prDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.6,
  },
  gridContainer: {
    backgroundColor: colors.hairlineSoft,
    gap: 1,
  },
  weekRow: {
    flexDirection: "row",
    gap: 1,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCell: {
    opacity: 0.3,
  },
  workoutCell: {
    backgroundColor: colors.surfaceElevated,
  },
  todayCell: {
    backgroundColor: colors.accent,
  },
  selectedCell: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  dayText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textSecondary,
  },
  workoutDayText: {
    color: colors.text,
    fontFamily: fonts.monoMedium,
  },
  todayText: {
    color: "#FFFFFF",
    fontFamily: "JetBrainsMono_700Bold",
  },
  futureText: {
    color: colors.textTertiary,
  },
  prDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pr,
    marginTop: 2,
  },
});
