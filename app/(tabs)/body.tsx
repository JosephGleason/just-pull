import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "@legendapp/state/react";
import { workouts$, body_log$ } from "../../src/lib/store";
import { computeMuscleStates } from "../../src/hooks/useBodyModel";
import { BodyFigure } from "../../src/components/BodyFigure";
import { EXERCISE_MUSCLE_MAP } from "../../src/components/body/muscles";
import { WorkoutLogRow, BodyLogRow } from "../../src/types";
import { colors, typography, spacing } from "../../src/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Return the ISO date string's midnight UTC as a Date */
function toDate(s: string): Date {
  return new Date(s.slice(0, 10) + "T00:00:00Z");
}

const MS_PER_DAY = 86_400_000;

function formatDate(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const workoutsRecord = (useSelector(workouts$) ?? {}) as Record<string, WorkoutLogRow>;
  const bodyLogRecord = (useSelector(body_log$) ?? {}) as Record<string, BodyLogRow>;
  const [side, setSide] = useState<"front" | "back">("front");
  const [sliderValue, setSliderValue] = useState(1);

  const historyValues = Object.values(workoutsRecord);
  const bodyLogValues = Object.values(bodyLogRecord);
  const hasHistory = historyValues.length > 0;
  const hasBodyLog = bodyLogValues.length > 0;

  // Sort history by date ascending to find first workout
  const sortedHistory = useMemo(
    () =>
      [...historyValues].sort(
        (a, b) => toDate(a.date).getTime() - toDate(b.date).getTime()
      ),
    [historyValues]
  );

  const firstWorkoutDate = useMemo(
    () => (sortedHistory.length > 0 ? toDate(sortedHistory[0].date) : null),
    [sortedHistory]
  );

  const today = useMemo(() => {
    const d = new Date();
    return new Date(
      d.getUTCFullYear() +
        "-" +
        String(d.getUTCMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getUTCDate()).padStart(2, "0") +
        "T00:00:00Z"
    );
  }, []);

  const totalDays = useMemo(
    () =>
      firstWorkoutDate
        ? Math.round(
            (today.getTime() - firstWorkoutDate.getTime()) / MS_PER_DAY
          )
        : 0,
    [firstWorkoutDate, today]
  );

  const asOfDate = useMemo(() => {
    if (!firstWorkoutDate || totalDays === 0) return today;
    const offsetMs = sliderValue * totalDays * MS_PER_DAY;
    return new Date(firstWorkoutDate.getTime() + offsetMs);
  }, [firstWorkoutDate, sliderValue, totalDays, today]);

  const modelState = useMemo(
    () => computeMuscleStates(workoutsRecord, bodyLogRecord, asOfDate),
    [workoutsRecord, bodyLogRecord, asOfDate]
  );

  // Muscles trained in the last 7 days (only shown when slider is near today)
  const thisWeekMuscles = useMemo(() => {
    if (sliderValue < 0.95) return [];
    const sevenDaysAgo = new Date(today.getTime() - 7 * MS_PER_DAY);
    const recentMuscles = new Set<string>();
    for (const w of historyValues) {
      const wDate = toDate(w.date);
      if (wDate >= sevenDaysAgo && wDate <= today) {
        for (const ex of w.exercises) {
          const mapping = EXERCISE_MUSCLE_MAP[ex.key];
          if (mapping) {
            for (const muscle of Object.keys(mapping)) {
              recentMuscles.add(muscle);
            }
          }
        }
      }
    }
    return Array.from(recentMuscles);
  }, [historyValues, sliderValue, today]);

  const figureWidth = SCREEN_WIDTH * 0.7;
  const figureHeight = SCREEN_HEIGHT * 0.55;

  const formatStatValue = (value: number, decimals: number = 0): string => {
    if (value === 0) return "--";
    return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {/* Title */}
      <Text style={styles.title}>THE MIRROR</Text>

      {/* Body Figure */}
      <View style={styles.figureContainer}>
        <BodyFigure
          muscles={modelState.muscles}
          body_fat_percent={modelState.body_fat_percent}
          highlightedMuscles={thisWeekMuscles}
          side={side}
          onToggleSide={() => setSide((s) => (s === "front" ? "back" : "front"))}
          width={figureWidth}
          height={figureHeight}
        />
      </View>

      {/* Empty state messages */}
      {!hasHistory && (
        <Text style={styles.emptyPrompt}>
          Complete your first workout to start tracking
        </Text>
      )}
      {hasHistory && !hasBodyLog && (
        <Text style={styles.emptyPrompt}>
          Log body measurements in Settings
        </Text>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statColumn}>
          <Text style={styles.statValue}>
            {formatStatValue(modelState.body_weight)}
          </Text>
          <Text style={styles.statLabel}>WEIGHT</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statValue}>
            {formatStatValue(modelState.body_fat_percent, 1)}
          </Text>
          <Text style={styles.statLabel}>BODY FAT %</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statValue}>
            {formatStatValue(modelState.months_trained)}
          </Text>
          <Text style={styles.statLabel}>MONTHS TRAINED</Text>
        </View>
      </View>

      {/* Timeline Slider */}
      {hasHistory && (
        <View style={styles.sliderContainer}>
          <Text style={styles.dateLabel}>{formatDate(asOfDate)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={sliderValue}
            onValueChange={setSliderValue}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.surfaceTertiary}
            thumbTintColor={colors.accent}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  figureContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPrompt: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statColumn: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    ...typography.displayMedium,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sliderContainer: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  slider: {
    width: "100%",
    height: 40,
  },
});
