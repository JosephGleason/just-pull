import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { WorkoutLogRow } from "../types";
import { colors, typography, spacing, radius } from "../theme";

interface ProgressChartProps {
  exerciseKey: string;
  history: WorkoutLogRow[];
  units: string;
  width?: number;
}

interface DataPoint {
  date: string;
  weight: number;
}

function getDataPoints(exerciseKey: string, history: WorkoutLogRow[]): DataPoint[] {
  const points: DataPoint[] = [];

  for (const workout of history) {
    if (!workout.completed_at) continue;
    const exercise = workout.exercises.find((e) => e.key === exerciseKey);
    if (!exercise || exercise.sets.length === 0) continue;

    const maxWeight = Math.max(...exercise.sets.map((s) => s.weight));
    if (maxWeight > 0) {
      points.push({ date: workout.date, weight: maxWeight });
    }
  }

  // Sort chronologically
  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const DEFAULT_WIDTH = 360;
const CHART_HEIGHT = 160;
const CHART_PADDING = { top: 12, bottom: 24, left: 44, right: 12 };

export function ProgressChart({ exerciseKey, history, units, width: screenWidth }: ProgressChartProps) {
  const data = getDataPoints(exerciseKey, history);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
        <Text style={styles.emptySubtext}>Complete a workout to see progress</Text>
      </View>
    );
  }

  const chartWidth = (screenWidth ?? DEFAULT_WIDTH) - 32; // 16px horizontal padding on each side
  const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const rangeW = maxW - minW || 1;

  const toX = (i: number) =>
    CHART_PADDING.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
  const toY = (w: number) =>
    CHART_PADDING.top + plotHeight - ((w - minW) / rangeW) * plotHeight;

  // Build SVG polyline points string
  const pointsStr = data.map((d, i) => `${toX(i)},${toY(d.weight)}`).join(" ");

  // Y-axis tick values (3 ticks: min, mid, max)
  const yTicks = [minW, Math.round((minW + maxW) / 2), maxW];

  // X-axis labels: show at most 4 evenly spaced
  const xLabelIndices: number[] = [];
  if (data.length <= 4) {
    data.forEach((_, i) => xLabelIndices.push(i));
  } else {
    xLabelIndices.push(0);
    xLabelIndices.push(Math.round((data.length - 1) / 3));
    xLabelIndices.push(Math.round((2 * (data.length - 1)) / 3));
    xLabelIndices.push(data.length - 1);
  }

  return (
    <View style={[styles.chartContainer, { width: chartWidth, height: CHART_HEIGHT + 8 }]}>
      {/* SVG chart using absolute-positioned Views (no SVG dependency needed) */}
      <View style={{ width: chartWidth, height: CHART_HEIGHT, position: "relative" }}>
        {/* Y-axis labels */}
        {yTicks.map((tick, i) => {
          const y = toY(tick) - 8;
          return (
            <Text
              key={`label-${i}`}
              style={[styles.axisLabel, { position: "absolute", left: 0, top: y, width: CHART_PADDING.left - 4 }]}
            >
              {tick}
            </Text>
          );
        })}

        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <View
              key={`grid-${i}`}
              style={{
                position: "absolute",
                left: CHART_PADDING.left,
                top: y,
                width: plotWidth,
                height: 1,
                backgroundColor: colors.separator,
              }}
            />
          );
        })}

        {/* Line segments */}
        {data.map((point, i) => {
          if (i === 0) return null;
          const x1 = toX(i - 1);
          const y1 = toY(data[i - 1].weight);
          const x2 = toX(i);
          const y2 = toY(point.weight);

          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

          return (
            <View
              key={`line-${i}`}
              style={{
                position: "absolute",
                left: x1,
                top: y1,
                width: length,
                height: 2,
                backgroundColor: colors.accent,
                transformOrigin: "left center",
                transform: [{ rotate: `${angle}deg` }],
              }}
            />
          );
        })}

        {/* Data point dots */}
        {data.map((point, i) => (
          <View
            key={`dot-${i}`}
            style={{
              position: "absolute",
              left: toX(i) - 3,
              top: toY(point.weight) - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.accent,
            }}
          />
        ))}

        {/* X-axis labels */}
        {xLabelIndices.map((idx) => (
          <Text
            key={`xlabel-${idx}`}
            style={[
              styles.axisLabel,
              {
                position: "absolute",
                left: toX(idx) - 20,
                top: CHART_PADDING.top + plotHeight + 4,
                width: 40,
                textAlign: "center",
              },
            ]}
          >
            {formatDate(data[idx].date)}
          </Text>
        ))}

        {/* Units label */}
        <Text style={[styles.axisLabel, { position: "absolute", right: 0, top: 0, color: colors.textTertiary }]}>
          {units}
        </Text>
      </View>

      {/* Latest value highlight */}
      <Text style={styles.latestLabel}>
        Latest: <Text style={styles.latestValue}>{data[data.length - 1].weight} {units}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    ...typography.subtitle,
  },
  emptySubtext: {
    color: colors.textTertiary,
    ...typography.micro,
    marginTop: spacing.xs,
  },
  chartContainer: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  axisLabel: {
    color: colors.textTertiary,
    ...typography.micro,
  },
  latestLabel: {
    color: colors.textSecondary,
    ...typography.micro,
    textAlign: "right",
    paddingRight: spacing.xs,
    marginTop: 2,
  },
  latestValue: {
    color: colors.accent,
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
