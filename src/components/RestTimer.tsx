import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, typography, spacing, radius } from "../theme";

interface RestTimerProps {
  secondsLeft: number;
  isRunning: boolean;
  progress: number;
  onDismiss: () => void;
  onExtend: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RestTimer({
  secondsLeft,
  isRunning,
  progress,
  onDismiss,
  onExtend,
}: RestTimerProps) {
  if (!isRunning && secondsLeft <= 0) return null;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
        />
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.actionText}>Dismiss</Text>
        </TouchableOpacity>

        <Text style={styles.timeDisplay}>{formatTime(secondsLeft)}</Text>

        <TouchableOpacity onPress={onExtend} activeOpacity={0.7}>
          <Text style={styles.actionText}>+30s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    paddingBottom: 34, // safe area
    maxHeight: 70,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.separator,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  timeDisplay: {
    color: colors.text,
    ...typography.title1,
    fontVariant: ["tabular-nums"],
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
});
