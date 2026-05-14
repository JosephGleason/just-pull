import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ExerciseType } from "../types";
import { colors, fonts } from "../theme";

interface ExerciseCardProps {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  type: ExerciseType;
  isResting: boolean;
  units: string;
  isChinups: boolean;
  index?: number;
  isActive?: boolean;
  isDone?: boolean;
}

export function ExerciseCard({
  name,
  sets,
  reps,
  weight,
  type,
  isResting,
  units,
  isChinups,
  index = 0,
  isActive = false,
  isDone = false,
}: ExerciseCardProps) {
  const indexLabel = String(index + 1).padStart(2, "0");
  const isAmrap = type === "black";
  const scheme = isAmrap
    ? `${sets}×${reps}+AMRAP`
    : `${sets}×${reps}`;
  const weightLabel = isChinups ? `+${weight}` : `${weight}`;
  const unitLabel = units.toUpperCase();

  if (isResting) {
    return (
      <View style={[styles.row, styles.rowResting]}>
        <Text style={[styles.indexNum, styles.indexResting]}>{indexLabel}</Text>
        <View style={styles.center}>
          <Text style={styles.nameResting} numberOfLines={1}>{name}</Text>
          <Text style={styles.schemeResting}>REST THIS WEEK</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.restLabel}>REST</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.row,
        isActive && styles.rowActive,
        isDone && styles.rowDone,
      ]}
    >
      <Text
        style={[
          styles.indexNum,
          isActive && styles.indexActive,
          isDone && styles.indexDone,
        ]}
      >
        {indexLabel}
      </Text>
      <View style={styles.center}>
        {isDone ? (
          <>
            <Text style={[styles.name, styles.textDone]} numberOfLines={1}>{name}</Text>
            <Text style={styles.doneLabel}>{"✓"} LOGGED</Text>
          </>
        ) : (
          <>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.scheme}>{scheme}</Text>
          </>
        )}
      </View>
      <View style={styles.right}>
        <Text style={[styles.weight, isDone && styles.textDone]}>{weightLabel}</Text>
        <Text style={[styles.unit, isDone && styles.textDone]}>{unitLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    gap: 12,
  },
  rowActive: {
    backgroundColor: colors.accentGlow,
  },
  rowDone: {
    opacity: 0.55,
  },
  rowResting: {
    opacity: 0.35,
  },
  indexNum: {
    width: 28,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.11 * 11, // 0.15em
    color: colors.textTertiary,
  },
  indexActive: {
    color: colors.accent,
  },
  indexDone: {
    color: colors.textTertiary,
  },
  indexResting: {
    color: colors.textTertiary,
  },
  center: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    letterSpacing: -0.005 * 17,
    color: colors.text,
  },
  nameResting: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    letterSpacing: -0.005 * 17,
    color: colors.textTertiary,
  },
  scheme: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.1 * 10, // 0.1em
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: 2,
  },
  schemeResting: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.1 * 10,
    color: colors.textTertiary,
    textTransform: "uppercase",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  weight: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  unit: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.15 * 9,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: -2,
  },
  restLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.15 * 10,
    color: colors.textTertiary,
    textTransform: "uppercase",
  },
  doneLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 0.1 * 9,
    marginTop: 2,
  },
  textDone: {
    opacity: 0.7,
  },
});
