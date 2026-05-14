import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { ExerciseLog } from "../types";
import { colors, fonts } from "../theme";

interface WorkoutSummaryProps {
  exercises: ExerciseLog[];
  prsHit: string[];
  onFinish: () => void;
  onDiscard: () => void;
  isFirstWorkout?: boolean;
}

export function WorkoutSummary({
  exercises,
  prsHit,
  onFinish,
  onDiscard,
  isFirstWorkout,
}: WorkoutSummaryProps) {
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalVolume = exercises.reduce(
    (acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0
  );
  const prCount = prsHit.length;

  // Build set dots for each exercise
  const getSetDots = (ex: ExerciseLog) =>
    ex.sets.map((set) => ({
      isPr: set.is_pr && prsHit.includes(ex.name),
    }));

  // Format set summary string, e.g. "215x6 · 215x6 · 215x8*"
  const formatSets = (ex: ExerciseLog) =>
    ex.sets
      .map((s) => {
        const star =
          s.is_pr && prsHit.includes(ex.name) ? "★" : "";
        return `${s.weight}×${s.reps}${star}`;
      })
      .join(" · ");

  const handleDiscard = () => {
    Alert.alert(
      "Discard Workout",
      "Are you sure? All progress from this session will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: onDiscard },
      ]
    );
  };

  // Build a day label from the exercises
  const dayLabel = isFirstWorkout
    ? "FIRST SESSION."
    : "COMPLETE.";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER SLAB ── */}
      <View style={styles.headerSlab}>
        <Text style={styles.headerLabel}>SESSION · COMPLETE</Text>
        <Text style={styles.headerTitle}>
          {isFirstWorkout ? "FIRST WORKOUT" : "WORKOUT"}
          <Text style={styles.headerPeriod}>.</Text>
        </Text>
        {isFirstWorkout && (
          <Text style={styles.headerSubtitle}>You're on your way.</Text>
        )}
      </View>

      {/* ── STATS GRID ── */}
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>SETS</Text>
          <Text style={styles.statValue}>{totalSets}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>VOLUME</Text>
          <Text style={styles.statValue}>
            {totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>PRS</Text>
          <Text style={[styles.statValue, prCount > 0 && { color: colors.pr }]}>
            {prCount}
          </Text>
        </View>
      </View>

      {/* ── PR CALLOUT SLAB ── */}
      {prsHit.length > 0 && (
        <View style={styles.prCallout}>
          <Text style={styles.prCalloutLabel}>NEW RECORD</Text>
          {prsHit.map((name) => (
            <Text key={name} style={styles.prCalloutName}>
              {name}
            </Text>
          ))}
        </View>
      )}

      {/* ── SET LOG ── */}
      <View style={styles.setLog}>
        {exercises.map((ex, i) => {
          const dots = getSetDots(ex);
          return (
            <View key={ex.key} style={styles.setLogRow}>
              <Text style={styles.setLogIndex}>{i + 1}</Text>
              <View style={styles.setLogInfo}>
                <Text style={styles.setLogName}>{ex.name}</Text>
                <Text style={styles.setLogDetail}>{formatSets(ex)}</Text>
              </View>
              <View style={styles.setLogDots}>
                {dots.map((d, j) => (
                  <View
                    key={j}
                    style={[
                      styles.setDot,
                      d.isPr ? styles.setDotPr : styles.setDotDone,
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* ── BOTTOM BUTTONS ── */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.discardButton}
          onPress={handleDiscard}
          activeOpacity={0.8}
          accessibilityLabel="Discard workout"
          accessibilityRole="button"
        >
          <Text style={styles.discardButtonText}>DISCARD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sealButton}
          onPress={onFinish}
          activeOpacity={0.8}
          accessibilityLabel="Seal workout"
          accessibilityRole="button"
        >
          <Text style={styles.sealButtonText}>SEAL ✓</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  /* ── Header slab ── */
  headerSlab: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: colors.text,
    textTransform: "uppercase",
    lineHeight: 68,
  },
  headerPeriod: {
    color: colors.accent,
  },
  headerSubtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginTop: 4,
  },

  /* ── Stats grid ── */
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 16,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.hairline,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 48,
    color: colors.text,
  },

  /* ── PR callout ── */
  prCallout: {
    backgroundColor: colors.prGlow,
    borderTopWidth: 1,
    borderTopColor: colors.pr,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 0,
  },
  prCalloutLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.pr,
    marginBottom: 6,
  },
  prCalloutName: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  /* ── Set log ── */
  setLog: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  setLogRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  setLogIndex: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    width: 24,
  },
  setLogInfo: {
    flex: 1,
  },
  setLogName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    textTransform: "uppercase",
  },
  setLogDetail: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  setLogDots: {
    flexDirection: "row",
    gap: 3,
    paddingLeft: 8,
  },
  setDot: {
    width: 14,
    height: 6,
    borderRadius: 0,
  },
  setDotDone: {
    backgroundColor: colors.text,
  },
  setDotPr: {
    backgroundColor: colors.pr,
  },

  /* ── Bottom buttons ── */
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  discardButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 0,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  discardButtonText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.red,
    textTransform: "uppercase",
  },
  sealButton: {
    flex: 2,
    backgroundColor: colors.accent,
    borderRadius: 0,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sealButtonText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});
