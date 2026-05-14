import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSelector } from "@legendapp/state/react";
import { profile$, cycle_state$, weights$, current_session$, nutrition$, workouts$ } from "../../src/lib/store";
import { getProgramDay, getSetsForWeek } from "../../src/program";
import { getTargetWeight } from "../../src/hooks/useWorkout";
import { calculateNutrition } from "../../src/hooks/useNutrition";
import { ExerciseCard } from "../../src/components/ExerciseCard";
import { NutritionCard } from "../../src/components/NutritionCard";
import { ProfileRow, CycleStateInput, ExerciseWeightInput, NutritionInput, CurrentSessionData, CurrentSessionRow, WorkoutLogRow } from "../../src/types";
import { colors, fonts, spacing } from "../../src/theme";
import { MS_PER_DAY } from "../../src/utils/date";

function isChinupsKey(key: string) {
  return key.startsWith("chinups");
}

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useSelector(profile$) as ProfileRow | undefined;
  const cycleState = (useSelector(cycle_state$) ?? null) as CycleStateInput | null;
  const weights = (useSelector(weights$) ?? {}) as Record<string, ExerciseWeightInput>;
  const sessionRow = useSelector(current_session$) as CurrentSessionRow | null;
  const currentSession: CurrentSessionData | null = sessionRow?.data ?? null;
  const nutritionData = (useSelector(nutrition$) ?? null) as NutritionInput | null;
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const [showProgramInfo, setShowProgramInfo] = useState(false);
  const [deloadDismissed, setDeloadDismissed] = useState(false);
  const isLoading = !profile;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const programDay = cycleState ? getProgramDay(cycleState.next_day) : null;

  if (!cycleState || !profile || !programDay) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Set up your weights in Settings to get started.
        </Text>
      </View>
    );
  }

  const nutritionTargets =
    nutritionData
      ? calculateNutrition(nutritionData, profile.units)
      : null;

  const totalWeeks = 3;
  const exerciseCount = programDay.exercises.length;
  const dayPadded = String(cycleState.next_day).padStart(2, "0");
  const todayLabel = cycleState.is_deload ? "DELOAD" : `DAY ${cycleState.next_day}`;
  const dateStr = useMemo(() => new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }).toUpperCase(), []);

  const inactivity = useMemo(() => {
    const workouts = Object.values(workoutsRecord);
    if (workouts.length === 0) return { daysSince: 0, shouldPrompt: false };
    const latest = workouts.reduce((max, w) => w.date > max ? w.date : max, workouts[0].date);
    const daysSince = Math.floor((Date.now() - new Date(latest).getTime()) / MS_PER_DAY);
    return { daysSince, shouldPrompt: daysSince >= 14 && !cycleState.is_deload };
  }, [workoutsRecord, cycleState.is_deload]);

  const handleActivateDeload = () => {
    cycle_state$.is_deload.set(true);
    setDeloadDismissed(true);
  };

  const weekVolume = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * MS_PER_DAY);
    let thisWeek = 0;
    let lastWeek = 0;
    for (const w of Object.values(workoutsRecord)) {
      const d = new Date(w.date);
      const sets = w.exercises.reduce((n, ex) => n + ex.sets.length, 0);
      if (d >= sevenDaysAgo) thisWeek += sets;
      else if (d >= fourteenDaysAgo) lastWeek += sets;
    }
    const delta = thisWeek - lastWeek;
    return { thisWeek, delta };
  }, [workoutsRecord]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
      >
        {/* INACTIVITY DELOAD PROMPT */}
        {inactivity.shouldPrompt && !deloadDismissed && (
          <View style={styles.inactivityBanner}>
            <View style={styles.inactivityContent}>
              <Text style={styles.inactivityLabel}>
                {inactivity.daysSince} DAYS SINCE LAST SESSION
              </Text>
              <Text style={styles.inactivityBody}>
                After 2+ weeks off, a deload week helps you ease back in safely.
              </Text>
            </View>
            <View style={styles.inactivityActions}>
              <Pressable
                style={styles.inactivityDismiss}
                onPress={() => setDeloadDismissed(true)}
              >
                <Text style={styles.inactivityDismissText}>SKIP</Text>
              </Pressable>
              <Pressable
                style={styles.inactivityAccept}
                onPress={handleActivateDeload}
              >
                <Text style={styles.inactivityAcceptText}>DELOAD THIS WEEK</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* HERO SLAB */}
        <View style={styles.heroSlab}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>
              {dateStr} {"·"} CYCLE {cycleState.cycle_number} {"·"} WK {cycleState.week_number}/{totalWeeks}
            </Text>
            <Text style={styles.heroDisplay}>
              {todayLabel}
              <Text style={styles.heroPeriod}>.</Text>
            </Text>
            <Text style={styles.heroMono}>
              {exerciseCount} LIFTS {"·"} ~48 MIN
            </Text>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroDayLabel}>DAY</Text>
            <Text style={styles.heroDayNum}>{dayPadded}</Text>
          </View>
          {/* Deload badge */}
          {cycleState.is_deload && (
            <View style={styles.deloadBadge}>
              <Text style={styles.deloadText}>DELOAD</Text>
            </View>
          )}
          {/* Info tap target */}
          <Pressable
            onPress={() => setShowProgramInfo(true)}
            hitSlop={12}
            accessibilityLabel="Program information"
            accessibilityRole="button"
            style={styles.infoTap}
          >
            <Text style={styles.infoIcon}>?</Text>
          </Pressable>
        </View>

        {/* HAIRLINE DIVIDER */}
        <View style={styles.hairline} />

        {/* EXERCISE LIST */}
        {programDay.exercises.map((exercise, idx) => {
          const sets = getSetsForWeek(
            exercise,
            cycleState.week_number,
            cycleState.is_deload
          );
          const weight = getTargetWeight(exercise.key, weights, cycleState);
          const isResting = sets === 0;

          return (
            <ExerciseCard
              key={exercise.key}
              name={exercise.name}
              sets={sets}
              reps={exercise.reps}
              weight={weight}
              type={exercise.type}
              isResting={isResting}
              units={profile.units}
              isChinups={isChinupsKey(exercise.key)}
              index={idx}
            />
          );
        })}

        {/* NUTRITION CARD */}
        {nutritionTargets && <NutritionCard targets={nutritionTargets} />}

        {/* SECONDARY GLANCE — two-column stats */}
        <View style={styles.glanceRow}>
          <View style={[styles.glanceCell, styles.glanceCellLeft]}>
            <Text style={styles.glanceLabel}>WK VOLUME</Text>
            <Text style={styles.glanceNum}>{weekVolume.thisWeek}</Text>
            <Text style={[styles.glanceDelta, { color: weekVolume.delta >= 0 ? colors.green : colors.accent }]}>
              {weekVolume.delta >= 0 ? "+" : ""}{weekVolume.delta} VS LAST WK
            </Text>
          </View>
          <View style={styles.glanceCell}>
            <Text style={styles.glanceLabel}>CYCLE {cycleState.cycle_number}</Text>
            <Text style={styles.glanceNum}>WK{cycleState.week_number}</Text>
            <Text style={styles.glanceTrend}>
              {cycleState.is_deload ? "DELOAD" : `${totalWeeks - cycleState.week_number} WK LEFT`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA SLAB */}
      {currentSession ? (
        <Pressable
          style={({ pressed }) => [styles.ctaSlab, pressed && styles.ctaPressed]}
          onPress={() => router.push("/workout")}
        >
          <Text style={styles.ctaText}>RESUME {"▸"}</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.ctaSlab, pressed && styles.ctaPressed]}
          onPress={() => router.push("/workout")}
        >
          <Text style={styles.ctaText}>BEGIN {"▸"}</Text>
        </Pressable>
      )}

      {/* PROGRAM INFO MODAL — FORGE STYLE */}
      <Modal
        visible={showProgramInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProgramInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Modal header slab */}
              <Text style={styles.modalTitle}>THE PROGRAM.</Text>
              <View style={styles.hairline} />

              <Text style={styles.modalSectionLabel}>SCHEDULE</Text>
              <Text style={styles.modalSectionBody}>
                5 training days per week: Days 1, 2, 3, 5, and 6. Days 4 and
                7 are rest days.
              </Text>
              <View style={styles.hairline} />

              <Text style={styles.modalSectionLabel}>3-WEEK CYCLES</Text>
              <Text style={styles.modalSectionBody}>
                Sets taper each week to manage fatigue. Week 1 is full volume,
                Week 2 is reduced, and Week 3 is minimal. After each cycle,
                weights increase and the cycle resets.
              </Text>
              <View style={styles.hairline} />

              <Text style={styles.modalSectionLabel}>EXERCISE TYPES</Text>
              <Text style={styles.modalSectionBody}>
                Compounds (red) are the main lifts and increase each cycle.
                Heavy compounds (blue) like squat and deadlift follow the same
                progression with fewer sets. Accessories (black) are AMRAP
                sets where you hit the target reps or more.
              </Text>
              <View style={styles.hairline} />

              <Text style={styles.modalSectionLabel}>DELOAD</Text>
              <Text style={styles.modalSectionBody}>
                Every 3rd cycle is a deload that reduces set counts further,
                giving your body time to recover before pushing heavier.
              </Text>
              <View style={styles.hairline} />

              <Text style={styles.modalSectionLabel}>PR PROGRESSION</Text>
              <Text style={styles.modalSectionBody}>
                After each cycle, compound weights increase by your set
                increment. If you fail reps on a PR attempt, the weight stays
                the same next cycle until you hit the target.
              </Text>
            </ScrollView>

            <View style={styles.hairline} />
            <Pressable
              onPress={() => setShowProgramInfo(false)}
              style={styles.modalCloseButton}
              accessibilityLabel="Close program info"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>CLOSE {"▸"}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ── HERO SLAB ──
  heroSlab: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    position: "relative",
  },
  heroLeft: {
    maxWidth: "70%",
  },
  heroLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  heroDisplay: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: colors.text,
    lineHeight: 68,
  },
  heroPeriod: {
    color: colors.accent,
  },
  heroMono: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginTop: 8,
  },
  heroRight: {
    position: "absolute",
    right: 16,
    top: 24,
    alignItems: "flex-end",
  },
  heroDayLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  heroDayNum: {
    fontFamily: fonts.display,
    fontSize: 132,
    color: colors.text,
    lineHeight: 158,
    opacity: 0.08,
    marginTop: -12,
    marginRight: -4,
  },
  deloadBadge: {
    position: "absolute",
    left: 16,
    bottom: 20,
    backgroundColor: colors.accentGlow,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deloadText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.accent,
  },
  infoTap: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ── HAIRLINE ──
  hairline: {
    height: 1,
    backgroundColor: colors.hairline,
  },

  // ── CTA SLAB ──
  ctaSlab: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: {
    backgroundColor: colors.accentDim,
  },
  ctaText: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: 0.06 * 26,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },

  // ── SECONDARY GLANCE ──
  glanceRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  glanceCell: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  glanceCellLeft: {
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  glanceLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  glanceNum: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.text,
    lineHeight: 48,
  },
  glanceDelta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.green,
    marginTop: 4,
  },
  glanceTrend: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.accent,
    marginTop: 4,
  },

  // ── PROGRAM INFO MODAL (FORGE STYLE) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  modalSectionBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  modalCloseButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  modalCloseText: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 0.06 * 18,
    color: colors.accent,
    textTransform: "uppercase",
  },

  // ── Inactivity deload prompt ──
  inactivityBanner: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  inactivityContent: {
    padding: 16,
  },
  inactivityLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.accent,
    marginBottom: 6,
  },
  inactivityBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  inactivityActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  inactivityDismiss: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  inactivityDismissText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.textSecondary,
  },
  inactivityAccept: {
    flex: 2,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.accent,
  },
  inactivityAcceptText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: "#FFFFFF",
  },
});
