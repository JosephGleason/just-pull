import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "@legendapp/state/react";
import { workouts$ } from "../../src/lib/store";
import { EXERCISE_MUSCLE_MAP, MUSCLE_GROUPS } from "../../src/components/body/muscles";
import { WorkoutLogRow } from "../../src/types";
import { colors, fonts, forgeStyles } from "../../src/theme";
import { MS_PER_DAY, toDate } from "../../src/utils/date";

const PERIODS = ["7D", "14D", "30D"] as const;
type Period = (typeof PERIODS)[number];

function periodToDays(p: Period): number {
  switch (p) {
    case "7D": return 7;
    case "14D": return 14;
    case "30D": return 30;
  }
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: "CHEST",
  shoulders: "SHOULDERS",
  triceps: "TRICEPS",
  back: "BACK",
  biceps: "BICEPS",
  quads: "QUADS",
  forearms: "FOREARMS",
  hamstrings: "HAMS",
  glutes: "GLUTES",
  calves: "CALVES",
};

interface MuscleData {
  id: string;
  label: string;
  sets: number;
  prev: number;
}

function computeMuscleSets(
  workouts: WorkoutLogRow[],
  cutoffDate: Date,
  days: number
): MuscleData[] {
  const periodStart = new Date(cutoffDate.getTime() - days * MS_PER_DAY);
  const prevStart = new Date(periodStart.getTime() - days * MS_PER_DAY);

  const accumulate = (from: Date, to: Date) => {
    const totals: Record<string, number> = {};
    for (const m of MUSCLE_GROUPS) totals[m] = 0;
    for (const w of workouts) {
      const d = toDate(w.date);
      if (d >= from && d < to) {
        for (const ex of w.exercises) {
          const mapping = EXERCISE_MUSCLE_MAP[ex.key];
          if (!mapping) continue;
          const setCount = ex.sets.length;
          for (const [muscle, weight] of Object.entries(mapping)) {
            totals[muscle] = (totals[muscle] ?? 0) + Math.round(setCount * weight);
          }
        }
      }
    }
    return totals;
  };

  const current = accumulate(periodStart, cutoffDate);
  const previous = accumulate(prevStart, periodStart);

  return MUSCLE_GROUPS.map((m) => ({
    id: m,
    label: MUSCLE_LABELS[m] ?? m.toUpperCase(),
    sets: current[m] ?? 0,
    prev: previous[m] ?? 0,
  }));
}

function heatColor(n: number, max: number): string {
  if (max === 0) return colors.textTertiary;
  const r = n / max;
  if (r > 0.75) return colors.accent;
  if (r > 0.5) return colors.accentHot;
  if (r > 0.25) return colors.textSecondary;
  return colors.textTertiary;
}

export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const [period, setPeriod] = useState<Period>("7D");

  const today = useMemo(() => {
    const d = new Date();
    const tomorrow = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
    return tomorrow;
  }, []);

  const history = useMemo(
    () => Object.values(workoutsRecord).sort((a, b) => a.date.localeCompare(b.date)),
    [workoutsRecord]
  );

  const days = periodToDays(period);

  const muscleData = useMemo(
    () => computeMuscleSets(history, today, days),
    [history, today, days]
  );

  const sorted = useMemo(
    () => [...muscleData].sort((a, b) => b.sets - a.sets),
    [muscleData]
  );

  const max = useMemo(() => Math.max(...sorted.map((m) => m.sets), 1), [sorted]);
  const totalSets = useMemo(() => sorted.reduce((n, m) => n + m.sets, 0), [sorted]);
  const totalPrev = useMemo(() => sorted.reduce((n, m) => n + m.prev, 0), [sorted]);

  const sessionCount = useMemo(() => {
    const cutoff = new Date(today.getTime() - days * MS_PER_DAY);
    return history.filter((w) => toDate(w.date) >= cutoff && toDate(w.date) <= today).length;
  }, [history, today, days]);

  const allUndertrained = useMemo(() => {
    if (totalSets === 0) return [];
    const low = sorted.filter((m) => m.sets > 0 && m.sets <= max * 0.2).map((m) => m.label);
    const zero = sorted.filter((m) => m.sets === 0).map((m) => m.label);
    return [...low, ...zero];
  }, [sorted, max, totalSets]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
      >
        {/* ── HEADER SLAB ── */}
        <View style={forgeStyles.headerSlab}>
          <Text style={forgeStyles.fLabel}>VOLUME · BY MUSCLE</Text>
          <Text style={forgeStyles.fDisplay}>
            {period} HEAT<Text style={forgeStyles.accentDot}>.</Text>
          </Text>
        </View>

        {/* ── PERIOD SELECTOR ── */}
        <View style={forgeStyles.selectorRow}>
          {PERIODS.map((pp, idx) => {
            const isActive = pp === period;
            const isLast = idx === PERIODS.length - 1;
            return (
              <TouchableOpacity
                key={pp}
                style={[
                  forgeStyles.selectorTab,
                  isActive && forgeStyles.selectorTabActive,
                  !isLast && forgeStyles.selectorTabBorder,
                ]}
                onPress={() => setPeriod(pp)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    forgeStyles.selectorText,
                    isActive && forgeStyles.selectorTextActive,
                  ]}
                >
                  {pp}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── GLANCE STATS ── */}
        <View style={styles.glanceRow}>
          <View style={[styles.glanceCell, styles.glanceBorder]}>
            <Text style={styles.glanceLabel}>TOTAL SETS</Text>
            <Text style={styles.glanceNum}>{totalSets}</Text>
          </View>
          <View style={[styles.glanceCell, styles.glanceBorder]}>
            <Text style={styles.glanceLabel}>VS PRIOR</Text>
            <Text
              style={[
                styles.glanceNum,
                {
                  color:
                    totalSets >= totalPrev ? colors.green : colors.accent,
                },
              ]}
            >
              {totalSets >= totalPrev ? "+" : ""}
              {totalSets - totalPrev}
            </Text>
          </View>
          <View style={styles.glanceCell}>
            <Text style={styles.glanceLabel}>SESSIONS</Text>
            <Text style={styles.glanceNum}>{sessionCount}</Text>
          </View>
        </View>
        <View style={forgeStyles.hairline} />

        {/* ── MUSCLE BARS ── */}
        <View style={styles.barsContainer}>
          {sorted.map((m, i) => {
            const pct = max > 0 ? m.sets / max : 0;
            const delta = m.sets - m.prev;
            return (
              <View key={m.id} style={styles.barRow}>
                <View style={styles.barHeader}>
                  <View style={styles.barHeaderLeft}>
                    <Text style={styles.barIndex}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                    <Text style={styles.barName}>{m.label}</Text>
                  </View>
                  <View style={styles.barHeaderRight}>
                    <Text
                      style={[
                        styles.barDelta,
                        {
                          color:
                            delta > 0
                              ? colors.green
                              : delta < 0
                              ? colors.accent
                              : colors.textTertiary,
                        },
                      ]}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}
                    </Text>
                    <Text style={styles.barSets}>{m.sets}</Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${pct * 100}%`,
                        backgroundColor: heatColor(m.sets, max),
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* ── COACH NOTE ── */}
        {allUndertrained.length > 0 && (
          <View style={styles.coachSlab}>
            <Text style={styles.coachLabel}>
              UNDERTRAINED · {period}
            </Text>
            <Text style={styles.coachTitle}>
              {allUndertrained[0]}
              {allUndertrained.length > 1 && (
                <Text style={styles.coachTitleMuted}>
                  {" · "}
                  {allUndertrained.slice(1).join(" · ")}
                </Text>
              )}
            </Text>
            <Text style={styles.coachHint}>
              PUSH ACCESSORY VOLUME ON NEXT SESSION
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },

  // ── Glance stats ──
  glanceRow: {
    flexDirection: "row",
  },
  glanceCell: {
    flex: 1,
    padding: 14,
  },
  glanceBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  glanceLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  glanceNum: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 48,
    color: colors.text,
  },
  // ── Muscle bars ──
  barsContainer: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  barRow: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  barHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  barIndex: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.textTertiary,
    marginRight: 8,
    width: 20,
  },
  barName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  barHeaderRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  barDelta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  barSets: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  barTrack: {
    height: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 0,
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 0,
  },

  // ── Coach note ──
  coachSlab: {
    backgroundColor: colors.surfaceElevated,
    padding: 16,
  },
  coachLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  coachTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  coachTitleMuted: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  coachHint: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
});
