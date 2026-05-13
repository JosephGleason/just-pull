import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "../theme";

interface CalendarGridProps {
  workoutDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISODate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function CalendarGrid({
  workoutDates,
  selectedDate,
  onSelectDate,
  month,
  year,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  // First day of month (0 = Sunday)
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  // Total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build grid cells: leading empty slots + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  // Split into weeks (rows)
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Month/year header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.navArrow}>{"‹"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.navArrow}>{"›"}</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week header row */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} style={styles.cell} />;
            }
            const isoDate = toISODate(year, month, day);
            const hasWorkout = workoutDates.has(isoDate);
            const isSelected = selectedDate === isoDate;

            return (
              <TouchableOpacity
                key={di}
                style={styles.cell}
                onPress={() => onSelectDate(isoDate)}
                activeOpacity={0.7}
              >
                <View style={[styles.dayCircle, isSelected && styles.selectedCircle]}>
                  <Text style={[styles.dayNumber, isSelected && styles.selectedDayNumber]}>
                    {day}
                  </Text>
                </View>
                {hasWorkout && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  navButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  navArrow: {
    color: colors.accent,
    fontSize: 24,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  monthLabel: {
    color: colors.text,
    ...typography.subtitle,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: "center",
  },
  dayLabel: {
    color: colors.textTertiary,
    ...typography.caption,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: {
    backgroundColor: colors.accent,
  },
  dayNumber: {
    color: colors.text,
    ...typography.body,
  },
  selectedDayNumber: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.green,
    marginTop: 2,
  },
});
