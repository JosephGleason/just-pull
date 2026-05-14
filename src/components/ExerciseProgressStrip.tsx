import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, fonts, spacing, radius } from "../theme";
import { ExerciseLog } from "../types";

interface ExerciseProgressStripProps {
  exercises: ExerciseLog[];
  currentIndex: number;
  onSkipTo: (index: number) => void;
}

const SHORT_NAMES: Record<string, string> = {
  Deadlift: "DL",
  Chinups: "Chin",
  "BB Rows": "Rows",
  Curls: "Curls",
  Bench: "Bench",
  "Incline Press": "Inc",
  Flies: "Flies",
  "Tricep Ext": "Tri",
  Squat: "Squat",
  OHP: "OHP",
  "Calf Raise": "Calf",
  "Rear Delt Fly": "RDF",
  "Lat Raise": "Lat",
};

function getShortName(name: string): string {
  return SHORT_NAMES[name] ?? name.split(" ")[0].slice(0, 5);
}

type PillStatus = "completed" | "current" | "skipped" | "upcoming";

function getPillStatus(
  index: number,
  currentIndex: number,
  setsLogged: number
): PillStatus {
  if (index === currentIndex) return "current";
  if (index > currentIndex) return "upcoming";
  return setsLogged > 0 ? "completed" : "skipped";
}

export function ExerciseProgressStrip({
  exercises,
  currentIndex,
  onSkipTo,
}: ExerciseProgressStripProps) {
  return (
    <View style={styles.container}>
      {exercises.map((ex, i) => {
        const status = getPillStatus(i, currentIndex, ex.sets.length);
        const tappable = status === "upcoming";

        return (
          <TouchableOpacity
            key={ex.key}
            style={[styles.pill, statusBg[status]]}
            disabled={!tappable}
            onPress={() => onSkipTo(i)}
            activeOpacity={tappable ? 0.7 : 1}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityLabel={`${ex.name}, ${status}${tappable ? ", tap to skip to this exercise" : ""}`}
            accessibilityRole={tappable ? "button" : "text"}
          >
            <Text
              style={[styles.pillText, statusText[status]]}
              numberOfLines={1}
            >
              {getShortName(ex.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  pill: {
    flex: 1,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

const statusBg = StyleSheet.create({
  completed: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: "transparent",
  },
  current: {
    backgroundColor: colors.accent,
    borderColor: "transparent",
  },
  skipped: {
    backgroundColor: colors.surface,
    borderColor: colors.separator,
  },
  upcoming: {
    backgroundColor: colors.surfaceElevated,
    borderColor: "transparent",
  },
});

const statusText = StyleSheet.create({
  completed: {
    color: colors.green,
  },
  current: {
    color: colors.bg,
  },
  skipped: {
    color: colors.textTertiary,
    textDecorationLine: "line-through",
  },
  upcoming: {
    color: colors.textSecondary,
  },
});
