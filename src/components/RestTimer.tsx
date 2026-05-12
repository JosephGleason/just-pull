import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

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
        <TouchableOpacity onPress={onDismiss} style={styles.actionButton} activeOpacity={0.7}>
          <Text style={styles.actionButtonText}>Dismiss</Text>
        </TouchableOpacity>

        <Text style={styles.timeDisplay}>{formatTime(secondsLeft)}</Text>

        <TouchableOpacity onPress={onExtend} style={styles.actionButton} activeOpacity={0.7}>
          <Text style={styles.actionButtonText}>+30s</Text>
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
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingBottom: 34, // safe area
    paddingHorizontal: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#333333",
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  timeDisplay: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  actionButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 20,
    minWidth: 80,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#A3A3A3",
    fontSize: 15,
    fontWeight: "600",
  },
});
