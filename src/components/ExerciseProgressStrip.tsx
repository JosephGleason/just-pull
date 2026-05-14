import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ExerciseLog } from "../types";
import { colors, fonts } from "../theme";

interface ExerciseProgressStripProps {
  exercises: ExerciseLog[];
  currentIndex: number;
  onSkipTo: (index: number) => void;
}

function getTabLabel(name: string): string {
  return name.length > 7 ? name.slice(0, 7) : name;
}

type TabStatus = "done" | "active" | "upcoming";

function getStatus(
  index: number,
  currentIndex: number,
  setsLogged: number
): TabStatus {
  if (index === currentIndex) return "active";
  if (index < currentIndex) return "done";
  return "upcoming";
}

export function ExerciseProgressStrip({
  exercises,
  currentIndex,
  onSkipTo,
}: ExerciseProgressStripProps) {
  return (
    <View style={styles.container}>
      {exercises.map((ex, i) => {
        const status = getStatus(i, currentIndex, ex.sets.length);
        const tappable = status === "upcoming";
        const isLast = i === exercises.length - 1;

        return (
          <TouchableOpacity
            key={ex.key}
            style={[
              styles.tab,
              status === "active" && styles.tabActive,
              !isLast && styles.tabDivider,
            ]}
            disabled={!tappable}
            onPress={() => onSkipTo(i)}
            activeOpacity={tappable ? 0.7 : 1}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityLabel={`${ex.name}, ${status}${tappable ? ", tap to skip to this exercise" : ""}`}
            accessibilityRole={tappable ? "button" : "text"}
          >
            <Text
              style={[
                styles.tabText,
                status === "done" && styles.tabTextDone,
                status === "active" && styles.tabTextActive,
                status === "upcoming" && styles.tabTextUpcoming,
              ]}
              numberOfLines={1}
            >
              {status === "done" ? "✓ " : ""}
              {getTabLabel(ex.name).toUpperCase()}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  tabDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.hairlineSoft,
  },
  tabText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  tabTextDone: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textInverse,
  },
  tabTextUpcoming: {
    color: colors.textTertiary,
  },
});
