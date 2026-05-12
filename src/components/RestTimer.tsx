import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, typography, spacing } from "../theme";

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

  // Progress goes from 100% (full) to 0% (done) — shrinks right to left
  const widthPercent = Math.min(progress * 100, 100);

  return (
    <View style={styles.container}>
      {/* Thin amber line at the very top */}
      <View style={styles.lineTrack}>
        <View style={[styles.lineFill, { width: `${widthPercent}%` }]} />
      </View>

      {/* Time display centered */}
      <Text style={styles.timeDisplay}>{formatTime(secondsLeft)}</Text>

      {/* Dismiss / extend row */}
      <View style={styles.row}>
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.actionText}>Dismiss</Text>
        </TouchableOpacity>

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
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 0,
  },
  lineTrack: {
    height: 3,
    backgroundColor: colors.separator,
  },
  lineFill: {
    height: 3,
    backgroundColor: colors.accent,
  },
  timeDisplay: {
    color: colors.text,
    ...typography.displayMedium,
    textAlign: "center",
    marginTop: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: colors.textSecondary,
    ...typography.body,
  },
});
