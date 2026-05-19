import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ExerciseType, SetLog } from "../types";
import { PlateCalculator } from "./PlateCalculator";
import { colors, fonts } from "../theme";

interface SetLoggerProps {
  exerciseName: string;
  exerciseKey: string;
  exerciseType: ExerciseType;
  setNumber: number;
  totalSets: number;
  targetReps: number;
  weight: number;
  isPrAttempt: boolean;
  previousPerformance: string | null;
  units: string;
  isChinups: boolean;
  onComplete: (set: SetLog) => void;
  onWeightChange: (newWeight: number) => void;
  onSkip: () => void;
  lastSet: SetLog | null;
}

export function SetLogger({
  exerciseName,
  exerciseKey,
  exerciseType,
  setNumber,
  totalSets,
  targetReps,
  weight,
  isPrAttempt,
  previousPerformance,
  units,
  isChinups,
  onComplete,
  onWeightChange,
  onSkip,
  lastSet,
}: SetLoggerProps) {
  const [currentWeight, setCurrentWeight] = useState(weight);
  const [reps, setReps] = useState(targetReps);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAmrap = exerciseType === "black";
  const increment = exerciseType === "black" ? 5 : 2.5;

  const allSetsDone = setNumber > totalSets;

  // Build the scheme string, e.g. "4×6"
  const scheme = `${totalSets}×${targetReps}${isAmrap ? "+" : ""}`;

  // Determine set dot statuses
  const setDots = Array.from({ length: totalSets }, (_, i) => {
    const setIdx = i + 1;
    if (setIdx < setNumber) return "done"; // already logged
    if (setIdx === setNumber) return "active";
    return "unlogged";
  });

  // Weight delta vs target
  const weightDelta = currentWeight - weight;

  // Reps over target (for AMRAP)
  const repsOverTarget = reps - targetReps;

  const handleWeightChange = (delta: number) => {
    const newWeight = Math.max(0, currentWeight + delta);
    setCurrentWeight(newWeight);
    onWeightChange(newWeight);
  };

  const handleRepsChange = (delta: number) => {
    setReps((prev) => Math.max(0, prev + delta));
  };

  const handleComplete = () => {
    if (reps <= 0) return;
    if (submitting) return;
    setSubmitting(true);
    onComplete({
      weight: currentWeight,
      reps: reps,
      is_amrap: isAmrap,
      is_pr: isPrAttempt,
    });
    setTimeout(() => setSubmitting(false), 500);
  };

  const handleRepeatLast = () => {
    if (!lastSet || submitting) return;
    setSubmitting(true);
    onComplete({
      weight: lastSet.weight,
      reps: lastSet.reps,
      is_amrap: isAmrap,
      is_pr: isPrAttempt,
    });
    setTimeout(() => setSubmitting(false), 500);
  };

  const weightLabel = isChinups ? "ADDED WEIGHT" : "WEIGHT";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* ── EXERCISE HEADER SLAB ── */}
      <View style={styles.headerSlab}>
        <View style={styles.headerGrid}>
          <View style={styles.headerLeft}>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            <Text style={styles.exerciseMeta}>
              SET {setNumber} OF {totalSets}
              {isAmrap ? " · AMRAP" : ""}
              {isPrAttempt ? " · PR" : ""}
              {" · "}{scheme}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={onSkip}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.skipBtnText}>SKIP ▸</Text>
            </TouchableOpacity>
            <View style={styles.setDotsRow}>
              {setDots.map((status, i) => (
                <View
                  key={i}
                  style={[
                    styles.setDot,
                    status === "done" && styles.setDotDone,
                    status === "active" && styles.setDotActive,
                    status === "unlogged" && styles.setDotUnlogged,
                    isPrAttempt && status === "active" && styles.setDotPr,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {previousPerformance ? (
          <>
            <View style={styles.hairline} />
            <Text style={styles.prevPerf}>
              LAST · {previousPerformance.replace(/^Last:\s*/i, "")}
            </Text>
          </>
        ) : null}
      </View>

      {/* ── WEIGHT STEPPER SLAB ── */}
      <View style={styles.slab}>
        <View style={styles.labelRow}>
          <Text style={styles.slabLabel}>
            {weightLabel} · {units.toUpperCase()}
          </Text>
          {weightDelta !== 0 && (
            <Text style={styles.deltaLabel}>
              {weightDelta > 0 ? "+" : ""}{weightDelta} VS TARGET
            </Text>
          )}
          {!isChinups && (
            <TouchableOpacity
              onPress={() => setShowPlateCalc(true)}
              style={styles.platesBtn}
              activeOpacity={0.7}
              hitSlop={8}
              accessibilityLabel="Show plate calculator"
              accessibilityRole="button"
            >
              <Text style={styles.platesBtnText}>PLATES</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => handleWeightChange(-increment)}
            style={styles.stepButton}
            activeOpacity={0.7}
            accessibilityLabel="Decrease weight"
            accessibilityRole="button"
          >
            <Text style={styles.stepButtonText}>{"−"}</Text>
          </TouchableOpacity>

          <Text style={styles.hugeNumeral}>{currentWeight}</Text>

          <TouchableOpacity
            onPress={() => handleWeightChange(increment)}
            style={styles.stepButton}
            activeOpacity={0.7}
            accessibilityLabel="Increase weight"
            accessibilityRole="button"
          >
            <Text style={styles.stepButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Fine adjustment buttons */}
        <View style={styles.adjustRow}>
          {[-5, -2.5, 2.5, 5].map((delta) => (
            <TouchableOpacity
              key={delta}
              onPress={() => handleWeightChange(delta)}
              style={styles.adjustButton}
              activeOpacity={0.7}
            >
              <Text style={styles.adjustButtonText}>
                {delta > 0 ? "+" : ""}{delta}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── REPS STEPPER SLAB ── */}
      <View style={styles.slab}>
        <View style={styles.labelRow}>
          <Text style={styles.slabLabel}>
            REPS · TARGET {targetReps}{isAmrap ? "+" : ""}
          </Text>
          {isAmrap && repsOverTarget > 0 && (
            <Text style={styles.overTargetLabel}>
              +{repsOverTarget} OVER TARGET
            </Text>
          )}
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => handleRepsChange(-1)}
            style={styles.stepButton}
            activeOpacity={0.7}
            accessibilityLabel="Decrease reps"
            accessibilityRole="button"
          >
            <Text style={styles.stepButtonText}>{"−"}</Text>
          </TouchableOpacity>

          <Text style={styles.repsNumeral}>{reps}</Text>

          <TouchableOpacity
            onPress={() => handleRepsChange(1)}
            style={styles.stepButton}
            activeOpacity={0.7}
            accessibilityLabel="Increase reps"
            accessibilityRole="button"
          >
            <Text style={styles.stepButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Fine adjustment buttons for reps */}
        <View style={styles.adjustRow}>
          {[-2, -1, 1, 2, 3].map((delta) => (
            <TouchableOpacity
              key={delta}
              onPress={() => handleRepsChange(delta)}
              style={styles.adjustButton}
              activeOpacity={0.7}
            >
              <Text style={styles.adjustButtonText}>
                {delta > 0 ? "+" : ""}{delta}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Plate Calculator Modal */}
      <PlateCalculator
        visible={showPlateCalc}
        weight={currentWeight}
        units={units}
        onClose={() => setShowPlateCalc(false)}
      />

      {/* ── CTA SLAB ── */}
      <TouchableOpacity
        style={[
          styles.ctaButton,
          allSetsDone && styles.ctaButtonInverted,
          submitting && { opacity: 0.5 },
        ]}
        onPress={handleComplete}
        disabled={submitting}
        activeOpacity={0.8}
        accessibilityLabel="Log set"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.ctaButtonText,
            allSetsDone && styles.ctaButtonTextInverted,
          ]}
        >
          {allSetsDone ? "NEXT EXERCISE ▸" : "LOG SET ✓"}
        </Text>
      </TouchableOpacity>

      {lastSet ? (
        <TouchableOpacity
          style={[styles.repeatButton, submitting && { opacity: 0.5 }]}
          onPress={handleRepeatLast}
          disabled={submitting}
          activeOpacity={0.8}
          accessibilityLabel={`Repeat last set: ${lastSet.weight} ${units} times ${lastSet.reps} reps`}
          accessibilityRole="button"
        >
          <Text style={styles.repeatButtonText}>
            REPEAT LAST ({lastSet.weight}{units} × {lastSet.reps})
          </Text>
        </TouchableOpacity>
      ) : null}
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
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    paddingLeft: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  skipBtnText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },
  exerciseName: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 42,
    color: colors.text,
    textTransform: "uppercase",
  },
  exerciseMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginTop: 2,
  },

  /* ── Set dots ── */
  setDotsRow: {
    flexDirection: "row",
    gap: 4,
  },
  setDot: {
    width: 14,
    height: 6,
    borderRadius: 0,
  },
  setDotUnlogged: {
    backgroundColor: colors.hairlineStrong,
  },
  setDotDone: {
    backgroundColor: colors.text,
  },
  setDotActive: {
    backgroundColor: colors.accent,
  },
  setDotPr: {
    backgroundColor: colors.pr,
  },

  /* ── Previous perf ── */
  hairline: {
    height: 1,
    backgroundColor: colors.hairline,
    marginTop: 8,
  },
  prevPerf: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginTop: 6,
  },

  /* ── Slabs ── */
  slab: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  slabLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  deltaLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginLeft: 8,
  },
  overTargetLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.pr,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginLeft: 8,
  },
  platesBtn: {
    marginLeft: "auto",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  platesBtnText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  /* ── Steppers ── */
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text,
  },
  hugeNumeral: {
    fontFamily: fonts.display,
    fontSize: 124,
    color: colors.text,
    textAlign: "center",
    minWidth: 180,
    lineHeight: 150,
    includeFontPadding: true,
  },
  repsNumeral: {
    fontFamily: fonts.display,
    fontSize: 96,
    color: colors.text,
    textAlign: "center",
    minWidth: 140,
    lineHeight: 116,
    includeFontPadding: true,
  },

  /* ── Adjustment buttons ── */
  adjustRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  adjustButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  adjustButtonText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },

  /* ── CTA ── */
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: 0,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonInverted: {
    backgroundColor: colors.text,
  },
  ctaButtonText: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ctaButtonTextInverted: {
    color: colors.textInverse,
  },

  /* ── Repeat last ── */
  repeatButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 0,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatButtonText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
