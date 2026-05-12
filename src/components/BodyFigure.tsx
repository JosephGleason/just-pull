import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import Body, { type ExtendedBodyPart, type Slug } from "react-native-body-highlighter";
import Svg, { Path } from "react-native-svg";
import { getFatOverlayPath } from "./body/fatOverlay";
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

// ── Muscle-group → library slug mapping ─────────────────────────────────
// Our app's muscle groups don't always map 1:1 to the library's slugs.
// Front slugs: abs, adductors, ankles, biceps, calves, chest, deltoids,
//              feet, forearm, hair, hands, head, knees, neck, obliques,
//              quadriceps, tibialis, trapezius, triceps
// Back slugs:  adductors, ankles, calves, deltoids, feet, forearm,
//              gluteal, hair, hamstring, hands, head, lower-back, neck,
//              trapezius, triceps, upper-back

const MUSCLE_TO_FRONT_SLUGS: Record<string, Slug[]> = {
  chest: ["chest"],
  shoulders: ["deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  core: ["abs", "obliques"],
  quads: ["quadriceps"],
  calves: ["calves"],
};

const MUSCLE_TO_BACK_SLUGS: Record<string, Slug[]> = {
  back: ["upper-back", "lower-back", "trapezius"],
  shoulders: ["deltoids"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  calves: ["calves"],
};

// Reverse lookup: slug → our muscle group name (for press handler)
const SLUG_TO_MUSCLE_FRONT: Record<string, string> = {};
for (const [muscle, slugs] of Object.entries(MUSCLE_TO_FRONT_SLUGS)) {
  for (const slug of slugs) SLUG_TO_MUSCLE_FRONT[slug] = muscle;
}
const SLUG_TO_MUSCLE_BACK: Record<string, string> = {};
for (const [muscle, slugs] of Object.entries(MUSCLE_TO_BACK_SLUGS)) {
  for (const slug of slugs) SLUG_TO_MUSCLE_BACK[slug] = muscle;
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

/** Human-readable label for a slug */
function slugDisplayName(slug: string): string {
  const names: Record<string, string> = {
    abs: "core",
    obliques: "core",
    chest: "chest",
    deltoids: "shoulders",
    biceps: "biceps",
    triceps: "triceps",
    forearm: "forearms",
    quadriceps: "quads",
    calves: "calves",
    "upper-back": "back",
    "lower-back": "back",
    trapezius: "back",
    gluteal: "glutes",
    hamstring: "hamstrings",
  };
  return names[slug] ?? slug;
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

  const slugMap =
    side === "front" ? MUSCLE_TO_FRONT_SLUGS : MUSCLE_TO_BACK_SLUGS;
  const slugToMuscle =
    side === "front" ? SLUG_TO_MUSCLE_FRONT : SLUG_TO_MUSCLE_BACK;

  // Build the data array for react-native-body-highlighter
  const data = useMemo<ExtendedBodyPart[]>(() => {
    const parts: ExtendedBodyPart[] = [];

    for (const [muscleKey, slugs] of Object.entries(slugMap)) {
      const muscleSize = muscles[muscleKey] ?? 0;
      const intensity = sizeToIntensity(muscleSize);
      const isHighlighted = highlighted.has(muscleKey);

      let fill: string;
      if (isHighlighted) {
        fill = highlightColor(intensity, bodyFatPercent);
      } else {
        fill = intensityColors[intensity];
      }

      for (const slug of slugs) {
        parts.push({
          slug,
          intensity: intensity > 0 ? intensity : undefined,
          styles: {
            fill,
            stroke: `rgba(242, 240, 235, ${strokeOpacity})`,
            strokeWidth: 0.5,
          },
        });
      }
    }

    return parts;
  }, [
    muscles,
    bodyFatPercent,
    highlighted,
    intensityColors,
    strokeOpacity,
    slugMap,
  ]);

  // Scale: the library renders at 200*scale x 400*scale
  const scale = Math.min(width / 220, height / 420) * 1.1;

  // Fat overlay
  const fatPath = useMemo(
    () => getFatOverlayPath(bodyFatPercent, side),
    [bodyFatPercent, side],
  );
  const fatOpacity = clamp((bodyFatPercent - 10) / 25, 0, 0.7);

  // The library SVG dimensions
  const svgWidth = 200 * scale;
  const svgHeight = 400 * scale;

  const handlePress = useCallback(
    (part: ExtendedBodyPart) => {
      if (!part.slug) return;
      const muscleKey = slugToMuscle[part.slug];
      if (!muscleKey) return;
      const name = slugDisplayName(part.slug);
      const rawValue = muscles[muscleKey] ?? 0;
      setTooltip({ name, value: Math.round(rawValue * 100) });
      setTimeout(() => setTooltip(null), 2000);
    },
    [muscles, slugToMuscle],
  );

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

        {/* Layer 1: Muscle anatomy from library */}
        <Body
          data={data}
          colors={intensityColors}
          scale={scale}
          side={side}
          gender="male"
          onBodyPartPress={handlePress}
          border="none"
          defaultFill={defaultFill}
          defaultStroke={`rgba(242, 240, 235, ${strokeOpacity})`}
          defaultStrokeWidth={0.5}
        />

        {/* Layer 2: Fat overlay — covers muscles at high BF% */}
        {fatOpacity > 0.01 && (
          <Svg
            style={[
              StyleSheet.absoluteFill,
              {
                // Center over the Body component
                width: svgWidth,
                height: svgHeight,
                alignSelf: "center",
              },
            ]}
            viewBox={
              side === "front" ? "0 0 724 1448" : "724 0 724 1448"
            }
            preserveAspectRatio="xMidYMid meet"
            pointerEvents="none"
          >
            <Path
              d={fatPath}
              fill={`rgba(11, 11, 14, ${fatOpacity.toFixed(2)})`}
              stroke="none"
            />
          </Svg>
        )}

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
