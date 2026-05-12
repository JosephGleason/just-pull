import React, { useState } from "react";
import { View, StyleSheet, TouchableWithoutFeedback, Text } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { colors, typography, spacing, radius } from "../theme";
import {
  FRONT_REGIONS,
  BACK_REGIONS,
  SEPARATION_LINES,
  lerpPath,
  BodyRegion,
} from "./body/paths";

interface BodyFigureProps {
  muscles: Record<string, number>; // effectiveSize 0-1 per muscle group
  bodyFatPercent: number;
  highlightedMuscles: string[]; // muscles glowing amber (trained this week)
  side: "front" | "back";
  onToggleSide: () => void;
  width: number;
  height: number;
}

interface Tooltip {
  muscle: string;
  value: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Compute fill color for a muscle region.
 * Highlighted muscles get an amber glow; others interpolate from
 * surface dark to a warm dark tone based on effectiveSize.
 */
function getMuscleColor(
  muscle: string,
  effectiveSize: number,
  isHighlighted: boolean
): string {
  if (isHighlighted) {
    const alpha = (0.3 + effectiveSize * 0.4).toFixed(2);
    return `rgba(232, 168, 56, ${alpha})`;
  }
  // Interpolate from rgb(22,22,26) to rgb(60,55,45)
  const r = Math.round(22 + (60 - 22) * effectiveSize);
  const g = Math.round(22 + (55 - 22) * effectiveSize);
  const b = Math.round(26 + (45 - 26) * effectiveSize);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Compute stroke color: warm white with opacity scaling with muscle size.
 */
function getStrokeColor(effectiveSize: number): string {
  const alpha = (0.05 + effectiveSize * 0.15).toFixed(2);
  return `rgba(242, 240, 235, ${alpha})`;
}

/**
 * Compute the morph t-value for the core region, driven by body fat %
 * rather than pure muscle volume.
 */
function getCoreT(bodyFatPercent: number, effectiveSize: number): number {
  const waistScale = 1.0 + (bodyFatPercent - 12) * 0.008;
  return Math.max(0, 1 - waistScale + effectiveSize * 0.3);
}

export function BodyFigure({
  muscles,
  bodyFatPercent,
  highlightedMuscles,
  side,
  onToggleSide,
  width,
  height,
}: BodyFigureProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const regions: BodyRegion[] =
    side === "front" ? FRONT_REGIONS : BACK_REGIONS;

  // Separation line opacity: more visible at lower body fat
  const separationOpacity = clamp((20 - bodyFatPercent) / 8, 0, 1);

  // Gather the separation line paths for the current side
  const sepLines: string[] = [];
  if (side === "front") {
    const f = SEPARATION_LINES.front;
    sepLines.push(f.pecLine, f.centerLine, ...f.abLines, ...f.quadSep);
  } else {
    const b = SEPARATION_LINES.back;
    sepLines.push(b.spineLine, ...b.latLine);
  }

  function showTooltip(region: BodyRegion, effectiveSize: number) {
    if (!region.muscle) return;
    setTooltip({ muscle: region.muscle, value: effectiveSize });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <TouchableWithoutFeedback onPress={onToggleSide}>
      <View style={[styles.container, { width, height }]}>
        {/* Tooltip */}
        {tooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipName}>
              {tooltip.muscle.toUpperCase()}
            </Text>
            <Text style={styles.tooltipValue}>
              {Math.round(tooltip.value * 100)}%
            </Text>
          </View>
        )}

        <Svg
          width={width}
          height={height - 24}
          viewBox="0 0 200 400"
          preserveAspectRatio="xMidYMid meet"
        >
          <G>
            {regions.map((region) => {
              const effectiveSize = region.muscle
                ? muscles[region.muscle] ?? 0
                : 0;

              // Compute morph interpolation parameter
              const t =
                region.id === "core"
                  ? getCoreT(bodyFatPercent, effectiveSize)
                  : effectiveSize;

              const morphedPath = lerpPath(region.base, region.trained, t);
              const isHighlighted =
                !!region.muscle &&
                highlightedMuscles.includes(region.muscle);
              const fillColor = getMuscleColor(
                region.muscle,
                effectiveSize,
                isHighlighted
              );
              const strokeColor = getStrokeColor(effectiveSize);

              return (
                <Path
                  key={region.id}
                  d={morphedPath}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={0.5}
                  onPressIn={() => showTooltip(region, effectiveSize)}
                  onPressOut={hideTooltip}
                />
              );
            })}

            {/* Separation lines */}
            {sepLines.map((d, i) => (
              <Path
                key={`sep-${i}`}
                d={d}
                fill="none"
                stroke={`rgba(242, 240, 235, ${(separationOpacity * 0.3).toFixed(2)})`}
                strokeWidth={0.4}
              />
            ))}
          </G>
        </Svg>

        {/* Side label */}
        <Text style={styles.sideLabel}>{side === "front" ? "FRONT" : "BACK"}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

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
    backgroundColor: colors.surfaceElevated,
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
    color: colors.text,
  },
  tooltipValue: {
    fontFamily: typography.displaySmall.fontFamily,
    fontSize: typography.displaySmall.fontSize,
    color: colors.accent,
  },
  sideLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
  },
});
