import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../theme";

interface RestTimerProps {
  secondsLeft: number;
  isRunning: boolean;
  progress: number;
  onDismiss: () => void;
  onExtend: () => void;
  nextExerciseName?: string;
  exerciseProgress?: string;
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
  nextExerciseName,
  exerciseProgress,
}: RestTimerProps) {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 10;
  const isReady = secondsLeft <= 0;

  useEffect(() => {
    if (isUrgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isUrgent, pulseAnim]);

  if (!isRunning && secondsLeft <= 0) return null;

  // Progress bar: shrinks from 100% to 0%
  const widthPercent = Math.min(progress * 100, 100);

  // Determine if we're counting or compound/accessory
  const isCompound = exerciseProgress?.includes("Compound") ?? false;

  // Compute total time from progress (progress = remaining / total)
  // When progress=1, remaining=total. When progress=0, remaining=0.
  const totalSeconds =
    progress > 0 ? Math.round(secondsLeft / progress) : secondsLeft;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { paddingTop: insets.top },
      ]}
    >
      {/* ── STATUS STRIP ── */}
      <View style={styles.statusStrip}>
        <Text
          style={[
            styles.statusLabel,
            { color: isReady ? colors.green : colors.accent },
          ]}
        >
          REST · BETWEEN SETS
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          hitSlop={12}
          accessibilityLabel="Dismiss rest timer"
          accessibilityRole="button"
        >
          <Text style={styles.dismissText}>{"×"}</Text>
        </TouchableOpacity>
      </View>

      {/* ── COUNTDOWN AREA ── */}
      <View style={styles.countdownArea}>
        <Text
          style={[
            styles.countdownLabel,
            isReady && { color: colors.green },
          ]}
        >
          {isReady ? "TARGET REACHED — GO" : "REMAINING"}
        </Text>

        <Animated.Text
          style={[
            styles.countdownNumeral,
            isReady && { color: colors.green },
            isUrgent && { opacity: pulseAnim },
          ]}
        >
          {formatTime(Math.max(0, secondsLeft))}
        </Animated.Text>

        <Text style={styles.countdownMeta}>
          OF {formatTime(totalSeconds)} · {exerciseProgress ?? "REST"}
        </Text>
      </View>

      {/* ── PROGRESS BAR ── */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${widthPercent}%`,
              backgroundColor: isReady ? colors.green : colors.accent,
            },
          ]}
        />
      </View>

      {/* ── NEXT SET PREVIEW ── */}
      {nextExerciseName ? (
        <View style={styles.nextPreview}>
          <Text style={styles.nextLabel}>NEXT</Text>
          <Text style={styles.nextName}>{nextExerciseName}</Text>
          {exerciseProgress ? (
            <Text style={styles.nextScheme}>{exerciseProgress}</Text>
          ) : null}
        </View>
      ) : null}

      {/* ── SPACER ── */}
      <View style={{ flex: 1 }} />

      {/* ── ACTION BUTTONS ROW ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={onExtend}
          style={styles.actionButton}
          activeOpacity={0.7}
          accessibilityLabel="Add 30 seconds"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>+30S</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            onExtend();
            onExtend();
          }}
          style={styles.actionButton}
          activeOpacity={0.7}
          accessibilityLabel="Add 1 minute"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>+1M</Text>
        </TouchableOpacity>
      </View>

      {/* ── CTA ── */}
      <TouchableOpacity
        onPress={onDismiss}
        style={[
          styles.ctaButton,
          isReady && styles.ctaButtonReady,
        ]}
        activeOpacity={0.8}
        accessibilityLabel={isReady ? "Continue workout" : "Skip rest"}
        accessibilityRole="button"
      >
        <Text style={styles.ctaButtonText}>
          {isReady ? "CONTINUE ▸" : "SKIP ▸"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: insets.bottom + 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.overlay,
    zIndex: 100,
  },

  /* ── Status strip ── */
  statusStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.accent,
  },
  dismissText: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textSecondary,
  },

  /* ── Countdown ── */
  countdownArea: {
    alignItems: "center",
    paddingVertical: 16,
  },
  countdownLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  countdownNumeral: {
    fontFamily: fonts.display,
    fontSize: 160,
    color: colors.text,
    lineHeight: 192,
    textAlign: "center",
    includeFontPadding: true,
  },
  countdownMeta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginTop: 4,
  },

  /* ── Progress bar ── */
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginHorizontal: 16,
    borderRadius: 0,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 0,
  },

  /* ── Next preview ── */
  nextPreview: {
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 0,
  },
  nextLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nextName: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    textTransform: "uppercase",
  },
  nextScheme: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginTop: 2,
  },

  /* ── Action buttons ── */
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 0,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.text,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  /* ── CTA ── */
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: 0,
    paddingVertical: 18,
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonReady: {
    backgroundColor: colors.green,
  },
  ctaButtonText: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
