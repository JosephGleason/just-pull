import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSelector } from "@legendapp/state/react";
import { profile$, cycle_state$, workouts$ } from "../../src/lib/store";
import {
  ProgressChart,
  Sparkline,
  getGroupedChartDataPoints,
} from "../../src/components/ProgressChart";
import { MuscleHeatmap } from "../../src/components/MuscleHeatmap";
import { WorkoutLogRow, CycleStateInput } from "../../src/types";
import { colors, fonts } from "../../src/theme";

// Grouped lift definitions for the selector
const LIFT_GROUPS = [
  { label: "BENCH", keys: ["bench_4", "bench_8"] },
  { label: "SQUAT", keys: ["squat_4", "squat_8"] },
  { label: "DEAD", keys: ["deadlift_4"] },
  { label: "OHP", keys: ["ohp_4", "ohp_8"] },
  { label: "ROW", keys: ["bb_rows_4", "bb_rows_8"] },
] as const;

export default function ProgressScreen() {
  const router = useRouter();
  const profile = useSelector(profile$) as { units: string } | undefined;
  const cycleState = (useSelector(cycle_state$) ?? null) as CycleStateInput | null;
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const history = useMemo(
    () => Object.values(workoutsRecord).sort((a, b) => a.date.localeCompare(b.date)),
    [workoutsRecord]
  );
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);

  const units = profile?.units ?? "lb";
  const hasHistory = history.length > 0;
  const selectedGroup = LIFT_GROUPS[selectedGroupIdx];

  // Compute weeks of data
  const weeksOfData = useMemo(() => {
    if (history.length < 2) return 0;
    const first = new Date(history[0].date);
    const last = new Date(history[history.length - 1].date);
    return Math.max(1, Math.round((last.getTime() - first.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  }, [history]);

  // Hero 1RM for selected lift group
  const heroData = useMemo(() => {
    const points = getGroupedChartDataPoints(selectedGroup.keys as unknown as string[], history);
    if (points.length === 0) return { current: 0, delta: 0 };
    const current = points[points.length - 1].est1RM;
    const first = points[0].est1RM;
    return { current, delta: current - first };
  }, [selectedGroup, history]);

  // All lifts at a glance
  const allLiftsGlance = useMemo(() => {
    return LIFT_GROUPS.map((group) => {
      const points = getGroupedChartDataPoints(group.keys as unknown as string[], history);
      const current = points.length > 0 ? points[points.length - 1].est1RM : 0;
      const first = points.length > 0 ? points[0].est1RM : 0;
      const delta = current - first;
      const sparkData = points.map((p) => p.est1RM);
      return { label: group.label, current, delta, sparkData };
    });
  }, [history]);

  // Next PR projection
  const prProjection = useMemo(() => {
    let bestProjection: { lift: string; value: number; weight: number; reps: number } | null = null;
    for (const group of LIFT_GROUPS) {
      const points = getGroupedChartDataPoints(group.keys as unknown as string[], history);
      if (points.length < 2) continue;
      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      const trend = last.est1RM - prev.est1RM;
      if (trend > 0) {
        const projected = last.est1RM + trend;
        // Suggest the weight x 8 AMRAP to beat it
        // Reverse Epley: weight = 1RM / (1 + 8/30)
        const suggestedWeight = Math.round(projected / (1 + 8 / 30));
        if (!bestProjection || projected > bestProjection.value) {
          bestProjection = {
            lift: group.label,
            value: projected,
            weight: suggestedWeight,
            reps: 8,
          };
        }
      }
    }
    return bestProjection;
  }, [history]);

  if (!hasHistory) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyLabel}>PROGRESS</Text>
        <Text style={styles.emptyMessage}>
          Complete your first workout to see progress
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => router.navigate("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyCtaText}>GO TO TODAY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
    >
      {/* Header slab */}
      <View style={styles.headerSlab}>
        <Text style={styles.fLabel}>
          PROGRESS {"·"} {weeksOfData} WK
        </Text>
        <Text style={styles.fDisplay}>
          1RM TREND<Text style={styles.accentDot}>.</Text>
        </Text>
      </View>

      {/* Lift selector breadcrumb row */}
      <View style={styles.selectorRow}>
        {LIFT_GROUPS.map((group, idx) => {
          const isActive = idx === selectedGroupIdx;
          const isLast = idx === LIFT_GROUPS.length - 1;
          return (
            <TouchableOpacity
              key={group.label}
              style={[
                styles.selectorTab,
                isActive && styles.selectorTabActive,
                !isLast && styles.selectorTabBorder,
              ]}
              onPress={() => setSelectedGroupIdx(idx)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectorText,
                  isActive && styles.selectorTextActive,
                ]}
              >
                {group.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hero number slab */}
      <View style={styles.heroSlab}>
        <View style={styles.heroRow}>
          <Text style={styles.heroNumber}>{heroData.current || "—"}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaLabel}>
              EST 1RM {"·"} {units.toUpperCase()} {"·"} EPLEY
            </Text>
            {heroData.delta !== 0 && (
              <Text
                style={[
                  styles.heroDelta,
                  { color: heroData.delta > 0 ? colors.accent : colors.red },
                ]}
              >
                {heroData.delta > 0 ? "↗" : "↘"} {heroData.delta > 0 ? "+" : ""}
                {heroData.delta} {units.toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartWrap}>
          <ProgressChart
            exerciseKey={(selectedGroup.keys as unknown as string[])[0]}
            history={history}
            units={units}
            width={screenWidth}
          />
        </View>
      </View>

      {/* All lifts at a glance */}
      <View style={styles.glanceSection}>
        {allLiftsGlance.map((lift) => (
          <View key={lift.label} style={styles.glanceRow}>
            <View style={styles.glanceName}>
              <Text style={styles.glanceNameText}>{lift.label}</Text>
              <Text style={styles.glanceNameSub}>EST 1RM</Text>
            </View>
            <View style={styles.glanceSparkline}>
              <Sparkline data={lift.sparkData} />
            </View>
            <Text style={styles.glance1RM}>{lift.current || "—"}</Text>
            <Text
              style={[
                styles.glanceDelta,
                {
                  color:
                    lift.delta > 0 ? colors.accent : lift.delta < 0 ? colors.red : colors.textTertiary,
                },
              ]}
            >
              {lift.delta > 0 ? "+" : ""}
              {lift.delta !== 0 ? lift.delta : "—"}
            </Text>
          </View>
        ))}
      </View>

      {/* Next PR projection slab */}
      {prProjection && (
        <View style={styles.projectionSlab}>
          <Text style={styles.fLabel}>
            PROJECTED {"·"} NEXT PR WINDOW
          </Text>
          <View style={styles.projectionRow}>
            <Text style={styles.projectionDisplay}>
              {prProjection.lift} {"·"} {prProjection.value}
            </Text>
            <Text style={styles.projectionWeeks}>~ 3 WK</Text>
          </View>
          <Text style={styles.projectionTip}>
            BREAK BY HITTING {prProjection.weight} {"×"} {prProjection.reps} (AMRAP)
          </Text>
        </View>
      )}

      {/* Muscle Heatmap */}
      {cycleState && (
        <View style={styles.heatmapSection}>
          <Text style={styles.sectionLabel}>MUSCLES THIS WEEK</Text>
          <MuscleHeatmap history={history} cycleState={cycleState} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: "center",
  },
  emptyCta: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 0,
    marginTop: 20,
  },
  emptyCtaText: {
    color: colors.textInverse,
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },

  // Header slab
  headerSlab: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  fLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  fDisplay: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 46,
    color: colors.text,
    marginTop: 2,
  },
  accentDot: {
    color: colors.accent,
  },

  // Lift selector
  selectorRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  selectorTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorTabActive: {
    backgroundColor: colors.text,
  },
  selectorTabBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.hairlineSoft,
  },
  selectorText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  selectorTextActive: {
    color: colors.textInverse,
  },

  // Hero slab
  heroSlab: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroNumber: {
    fontFamily: fonts.display,
    fontSize: 96,
    color: colors.text,
    lineHeight: 116,
  },
  heroMeta: {
    alignItems: "flex-end",
    paddingBottom: 8,
  },
  heroMetaLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroDelta: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    color: colors.accent,
  },
  chartWrap: {
    alignItems: "center",
  },

  // All lifts at a glance
  glanceSection: {
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  glanceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  glanceName: {
    width: 80,
  },
  glanceNameText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  glanceNameSub: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginTop: 1,
  },
  glanceSparkline: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glance1RM: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
    width: 60,
    textAlign: "right",
  },
  glanceDelta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    width: 50,
    textAlign: "right",
    letterSpacing: 0.5,
  },

  // PR projection
  projectionSlab: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  projectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    marginBottom: 8,
  },
  projectionDisplay: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  projectionWeeks: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 12,
  },
  projectionTip: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },

  // Heatmap
  heatmapSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
});
