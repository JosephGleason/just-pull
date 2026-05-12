import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface CalendarGridProps {
  workoutDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

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
          <Text style={styles.navArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.navArrow}>{">"}</Text>
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
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navArrow: {
    color: "#4CAF50",
    fontSize: 20,
    fontWeight: "700",
  },
  monthLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    minHeight: 48,
    justifyContent: "center",
  },
  dayLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: {
    backgroundColor: "#4CAF50",
  },
  dayNumber: {
    color: "#E0E0E0",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedDayNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginTop: 2,
  },
});
