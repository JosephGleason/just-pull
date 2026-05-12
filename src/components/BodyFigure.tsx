import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import {
  FRONT_REGIONS,
  BACK_REGIONS,
  SEPARATION_LINES,
  getRegionPath,
  type BodyRegion,
} from "./body/paths";
import { colors as themeColors, typography, spacing, radius } from "../theme";

interface BodyFigureProps {
  muscles: Record<string, number>; // effectiveSize 0-1 per muscle group
  bodyFatPercent: number;
  highlightedMuscles: string[]; // muscles glowing amber (trained this week)
  side: "front" | "back";
  onToggleSide: () => void;
  width: number;
  height: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ── Intensity colors by body fat level ───────────────────────────────────
// At high BF%, muscles are hidden under fat — colors are muted and uniform.
// At low BF%, muscles are visible — high contrast between intensity levels.

function getIntensityColors(bodyFatPercent: number): string[] {
  // Definition factor: 0 at 25%+ BF, 1 at 10% BF
  const def = clamp((25 - bodyFatPercent) / 15, 0, 1);

  // Base (untrained) gets lighter at high BF (fat layer)
  const baseR = Math.round(22 + (1 - def) * 12); // 22 -> 34
  const baseG = Math.round(22 + (1 - def) * 10); // 22 -> 32
  const baseB = Math.round(26 + (1 - def) * 6); // 26 -> 32
  const base = `rgb(${baseR}, ${baseG}, ${baseB})`;

  // Higher intensities compressed toward base at high BF
  const i1R = Math.round(baseR + def * 15);
  const i1G = Math.round(baseG + def * 13);
  const i1B = Math.round(baseB + def * 6);

  const i2R = Math.round(baseR + def * 30);
  const i2G = Math.round(baseG + def * 22);
  const i2B = Math.round(baseB + def * 10);

  const i3R = Math.round(baseR + def * 50);
  const i3G = Math.round(baseG + def * 35);
  const i3B = Math.round(baseB + def * 12);

  return [
    base,
    `rgb(${i1R}, ${i1G}, ${i1B})`,
    `rgb(${i2R}, ${i2G}, ${i2B})`,
    `rgb(${i3R}, ${i3G}, ${i3B})`,
  ];
}

// Default fill shifts with BF — fatter = lighter/softer surface
function getDefaultFill(bodyFatPercent: number): string {
  const def = clamp((25 - bodyFatPercent) / 15, 0, 1);
  const r = Math.round(22 + (1 - def) * 14);
  const g = Math.round(22 + (1 - def) * 12);
  const b = Math.round(26 + (1 - def) * 8);
  return `rgb(${r}, ${g}, ${b})`;
}

// Stroke visibility: invisible at high BF, visible at low BF
function getStrokeOpacity(bodyFatPercent: number): number {
  return clamp((20 - bodyFatPercent) / 10, 0.02, 0.12);
}

/** Convert effectiveSize (0-1) to intensity bucket (0-3) */
function sizeToIntensity(size: number): 0 | 1 | 2 | 3 {
  if (size <= 0.05) return 0;
  if (size <= 0.35) return 1;
  if (size <= 0.65) return 2;
  return 3;
}

/** Amber highlight color at opacity proportional to intensity, dampened by BF */
function highlightColor(
  intensity: 0 | 1 | 2 | 3,
  bodyFatPercent: number,
): string {
  const def = clamp((25 - bodyFatPercent) / 15, 0, 1);
  const baseAlpha = [0.15, 0.3, 0.5, 0.7];
  const alpha = baseAlpha[intensity] * (0.4 + def * 0.6);
  return `rgba(232, 168, 56, ${alpha.toFixed(2)})`;
}

/** Human-readable label for a region */
function regionDisplayName(region: BodyRegion): string {
  const names: Record<string, string> = {
    head: "head",
    neck: "neck",
    "shoulder-l": "shoulders",
    "shoulder-r": "shoulders",
    "chest-l": "chest",
    "chest-r": "chest",
    "bicep-l": "biceps",
    "bicep-r": "biceps",
    "forearm-l": "forearms",
    "forearm-r": "forearms",
    core: "core",
    "quad-l": "quads",
    "quad-r": "quads",
    "calf-l": "calves",
    "calf-r": "calves",
    "head-back": "head",
    "neck-back": "neck",
    "rear-delt-l": "shoulders",
    "rear-delt-r": "shoulders",
    "back-l": "back",
    "back-r": "back",
    "tricep-l": "triceps",
    "tricep-r": "triceps",
    "forearm-back-l": "forearms",
    "forearm-back-r": "forearms",
    glutes: "glutes",
    "hamstring-l": "hamstrings",
    "hamstring-r": "hamstrings",
    "calf-back-l": "calves",
    "calf-back-r": "calves",
  };
  return names[region.id] ?? region.id;
}

// ── Component ────────────────────────────────────────────────────────────

export function BodyFigure({
  muscles,
  bodyFatPercent,
  highlightedMuscles,
  side,
  onToggleSide,
  width,
  height,
}: BodyFigureProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    value: number;
  } | null>(null);

  const highlighted = useMemo(
    () => new Set(highlightedMuscles),
    [highlightedMuscles],
  );

  const intensityColors = useMemo(
    () => getIntensityColors(bodyFatPercent),
    [bodyFatPercent],
  );
  const defaultFill = useMemo(
    () => getDefaultFill(bodyFatPercent),
    [bodyFatPercent],
  );
  const strokeOpacity = useMemo(
    () => getStrokeOpacity(bodyFatPercent),
    [bodyFatPercent],
  );

  const regions = side === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const sepLines =
    side === "front" ? SEPARATION_LINES.front : SEPARATION_LINES.back;

  // Scale the 200x400 SVG viewbox to fit the container
  const scale = Math.min(width / 220, height / 420) * 1.1;
  const svgWidth = 200 * scale;
  const svgHeight = 400 * scale;

  // Separation line opacity: higher at low BF, nearly invisible at high BF
  const sepOpacity = clamp((20 - bodyFatPercent) / 10, 0.02, 0.12);

  function handleRegionPress(region: BodyRegion) {
    const name = regionDisplayName(region);
    const muscleKey = region.muscle || name;
    const rawValue = muscles[muscleKey] ?? 0;
    setTooltip({ name, value: Math.round(rawValue * 100) });
    setTimeout(() => setTooltip(null), 2000);
  }

  function renderRegion(region: BodyRegion) {
    const muscleSize = region.muscle ? (muscles[region.muscle] ?? 0) : 0;
    const d = getRegionPath(region, bodyFatPercent, muscleSize);

    const intensity = sizeToIntensity(muscleSize);
    const isHighlighted =
      region.muscle !== "" && highlighted.has(region.muscle);

    let fill: string;
    if (isHighlighted) {
      fill = highlightColor(intensity, bodyFatPercent);
    } else if (region.muscle === "") {
      fill = defaultFill;
    } else {
      fill = intensityColors[intensity];
    }

    const strokeColor = `rgba(242, 240, 235, ${strokeOpacity})`;

    return (
      <Path
        key={region.id}
        d={d}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={0.5}
        onPress={() => handleRegionPress(region)}
      />
    );
  }

  function renderSeparationLines() {
    const lines: React.ReactElement[] = [];
    const strokeColor = `rgba(242, 240, 235, ${sepOpacity})`;

    if (side === "front") {
      const front = SEPARATION_LINES.front;

      lines.push(
        <Path
          key="pecLine"
          d={front.pecLine}
          stroke={strokeColor}
          strokeWidth={0.4}
          fill="none"
        />,
      );
      lines.push(
        <Path
          key="centerLine"
          d={front.centerLine}
          stroke={strokeColor}
          strokeWidth={0.3}
          fill="none"
        />,
      );
      front.abLines.forEach((d, i) =>
        lines.push(
          <Path
            key={`ab-${i}`}
            d={d}
            stroke={strokeColor}
            strokeWidth={0.4}
            fill="none"
          />,
        ),
      );
      front.quadSep.forEach((d, i) =>
        lines.push(
          <Path
            key={`qsep-${i}`}
            d={d}
            stroke={strokeColor}
            strokeWidth={0.35}
            fill="none"
          />,
        ),
      );
    } else {
      const back = SEPARATION_LINES.back;

      lines.push(
        <Path
          key="spineLine"
          d={back.spineLine}
          stroke={strokeColor}
          strokeWidth={0.3}
          fill="none"
        />,
      );
      back.latLine.forEach((d, i) =>
        lines.push(
          <Path
            key={`lat-${i}`}
            d={d}
            stroke={strokeColor}
            strokeWidth={0.35}
            fill="none"
          />,
        ),
      );
    }

    return lines;
  }

  return (
    <TouchableWithoutFeedback onPress={onToggleSide}>
      <View style={[styles.container, { width, height }]}>
        {/* Tooltip */}
        {tooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipName}>
              {tooltip.name.toUpperCase()}
            </Text>
            <Text style={styles.tooltipValue}>{tooltip.value}%</Text>
          </View>
        )}

        <Svg
          width={svgWidth}
          height={svgHeight}
          viewBox="0 0 200 400"
        >
          <G>
            {regions.map(renderRegion)}
            {renderSeparationLines()}
          </G>
        </Svg>

        {/* Side label */}
        <Text style={styles.sideLabel}>
          {side === "front" ? "FRONT" : "BACK"}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    backgroundColor: themeColors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    zIndex: 10,
  },
  tooltipName: {
    ...typography.caption,
    color: themeColors.text,
  },
  tooltipValue: {
    fontFamily: typography.displaySmall.fontFamily,
    fontSize: typography.displaySmall.fontSize,
    color: themeColors.accent,
  },
  sideLabel: {
    ...typography.caption,
    color: themeColors.textTertiary,
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
  },
});
