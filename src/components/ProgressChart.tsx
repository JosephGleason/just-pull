import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Polygon, Circle, Line, G } from "react-native-svg";
import { WorkoutLogRow } from "../types";
import { estimateOneRepMax } from "../hooks/useOneRepMax";
import { colors, fonts } from "../theme";

interface ProgressChartProps {
  exerciseKey: string;
  history: WorkoutLogRow[];
  units: string;
  width?: number;
}

export interface DataPoint {
  date: string;
  weight: number;
  est1RM: number;
}

export function getChartDataPoints(exerciseKey: string, history: WorkoutLogRow[]): DataPoint[] {
  const points: DataPoint[] = [];

  for (const workout of history) {
    if (!workout.completed_at) continue;
    const exercise = workout.exercises.find((e) => e.key === exerciseKey);
    if (!exercise || exercise.sets.length === 0) continue;

    let bestEst = 0;
    let bestWeight = 0;
    for (const s of exercise.sets) {
      const est = estimateOneRepMax(s.weight, s.reps);
      if (est > bestEst) {
        bestEst = est;
        bestWeight = s.weight;
      }
    }

    if (bestEst > 0) {
      points.push({ date: workout.date, weight: bestWeight, est1RM: bestEst });
    }
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

/** Get data points across multiple exercise keys for a lift group */
export function getGroupedChartDataPoints(exerciseKeys: string[], history: WorkoutLogRow[]): DataPoint[] {
  const pointsByDate = new Map<string, DataPoint>();

  for (const key of exerciseKeys) {
    const pts = getChartDataPoints(key, history);
    for (const pt of pts) {
      const existing = pointsByDate.get(pt.date);
      if (!existing || pt.est1RM > existing.est1RM) {
        pointsByDate.set(pt.date, pt);
      }
    }
  }

  return Array.from(pointsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

const CHART_HEIGHT = 130;
const PADDING = { top: 10, bottom: 20, left: 0, right: 0 };

export function ProgressChart({ exerciseKey, history, units, width: screenWidth }: ProgressChartProps) {
  const data = getChartDataPoints(exerciseKey, history);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>NO DATA</Text>
        <Text style={styles.emptySubtext}>Complete a workout to track progress</Text>
      </View>
    );
  }

  const chartWidth = (screenWidth ?? 360) - 32;
  const plotWidth = chartWidth - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const values = data.map((d) => d.est1RM);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const rangeV = maxV - minV || 1;

  const toX = (i: number) =>
    PADDING.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
  const toY = (v: number) =>
    PADDING.top + plotHeight - ((v - minV) / rangeV) * plotHeight;

  // Build polyline points
  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.est1RM)}`).join(" ");

  // Build polygon for area fill (close to bottom)
  const areaPoints =
    `${toX(0)},${PADDING.top + plotHeight} ` +
    data.map((d, i) => `${toX(i)},${toY(d.est1RM)}`).join(" ") +
    ` ${toX(data.length - 1)},${PADDING.top + plotHeight}`;

  // Grid lines at 0%, 25%, 50%, 75%, 100%
  const gridYPositions = [0, 0.25, 0.5, 0.75, 1].map(
    (pct) => PADDING.top + plotHeight - pct * plotHeight
  );

  // Date labels: start, middle, end
  const dateLabelIndices: number[] = [];
  if (data.length >= 3) {
    dateLabelIndices.push(0, Math.floor((data.length - 1) / 2), data.length - 1);
  } else if (data.length === 2) {
    dateLabelIndices.push(0, data.length - 1);
  } else {
    dateLabelIndices.push(0);
  }

  return (
    <View style={{ width: chartWidth }}>
      <Svg width={chartWidth} height={CHART_HEIGHT} viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}>
        {/* Grid lines */}
        <G>
          {gridYPositions.map((y, i) => (
            <Line
              key={`grid-${i}`}
              x1={PADDING.left}
              y1={y}
              x2={chartWidth - PADDING.right}
              y2={y}
              stroke={colors.hairline}
              strokeWidth={0.5}
            />
          ))}
        </G>

        {/* Area fill */}
        <Polygon points={areaPoints} fill={colors.accentGlow} />

        {/* Line */}
        <Polyline
          points={linePoints}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2}
        />

        {/* Data points */}
        <G>
          {data.map((d, i) => {
            const cx = toX(i);
            const cy = toY(d.est1RM);
            const isLast = i === data.length - 1;
            return (
              <G key={`pt-${i}`}>
                {isLast && (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                )}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={colors.bg}
                  stroke={colors.accent}
                  strokeWidth={1.5}
                />
              </G>
            );
          })}
        </G>
      </Svg>

      {/* Date labels below chart */}
      <View style={styles.dateRow}>
        {dateLabelIndices.map((idx) => {
          const align = idx === 0 ? "flex-start" : idx === data.length - 1 ? "flex-end" : "center";
          return (
            <View key={`dl-${idx}`} style={{ flex: 1, alignItems: align }}>
              <Text style={styles.dateLabel}>{formatDateShort(data[idx].date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Sparkline: minimal line for the "all lifts at a glance" section */
export function Sparkline({
  data,
  width = 120,
  height = 26,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline points={points} fill="none" stroke={colors.accent} strokeWidth={1.5} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 0,
    marginHorizontal: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 9,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: "row",
    paddingTop: 4,
  },
  dateLabel: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
