import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Body, { ExtendedBodyPart } from "react-native-body-highlighter";
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

// ── Slug ↔ Muscle mappings ───────────────────────────────────────────

/** Map our internal muscle keys to library slugs */
const MUSCLE_TO_SLUGS: Record<string, string[]> = {
  chest: ["chest"],
  shoulders: ["deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  back: ["upper-back", "trapezius"],
  quads: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves"],
};

/** Reverse map: library slug → our internal muscle name */
const SLUG_TO_MUSCLE: Record<string, string> = {};
for (const [muscle, slugs] of Object.entries(MUSCLE_TO_SLUGS)) {
  for (const slug of slugs) {
    SLUG_TO_MUSCLE[slug] = muscle;
  }
}
// Derived slugs also point to their source muscle for tooltip purposes
SLUG_TO_MUSCLE["abs"] = "core";
SLUG_TO_MUSCLE["obliques"] = "core";
SLUG_TO_MUSCLE["lower-back"] = "back";
SLUG_TO_MUSCLE["adductors"] = "quads";
SLUG_TO_MUSCLE["neck"] = "neck";
SLUG_TO_MUSCLE["tibialis"] = "calves";

// ── Intensity colors by body fat level ───────────────────────────────
// At high BF%, muscles are hidden under fat — colors are muted and uniform.
// At low BF%, muscles are visible — high contrast between intensity levels.

function getIntensityColors(bodyFatPercent: number): string[] {
  // Definition factor: 0 at 25%+ BF, 1 at 10% BF
  const def = clamp((25 - bodyFatPercent) / 15, 0, 1);

  // Base (untrained) gets lighter at high BF (fat layer)
  const baseR = Math.round(22 + (1 - def) * 12);  // 22 → 34
  const baseG = Math.round(22 + (1 - def) * 10);   // 22 → 32
  const baseB = Math.round(26 + (1 - def) * 6);    // 26 → 32
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

// Default fill also shifts with BF — fatter = lighter/softer surface
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

// ── Helpers ──────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Convert effectiveSize (0-1) to intensity (0-3) */
function sizeToIntensity(size: number): 0 | 1 | 2 | 3 {
  if (size <= 0.05) return 0;
  if (size <= 0.35) return 1;
  if (size <= 0.65) return 2;
  return 3;
}

/** Amber color at opacity proportional to intensity, dampened by body fat */
function highlightColor(intensity: 0 | 1 | 2 | 3, bodyFatPercent: number): string {
  const def = clamp((25 - bodyFatPercent) / 15, 0, 1);
  const baseAlpha = [0.15, 0.3, 0.5, 0.7];
  const alpha = baseAlpha[intensity] * (0.4 + def * 0.6);
  return `rgba(232, 168, 56, ${alpha.toFixed(2)})`;
}

function slugToDisplayName(slug: string): string {
  const muscle = SLUG_TO_MUSCLE[slug];
  if (muscle) return muscle;
  return slug.replace(/-/g, " ");
}

// ── Data builder ─────────────────────────────────────────────────────

function buildBodyData(
  muscles: Record<string, number>,
  bodyFatPercent: number,
  highlightedMuscles: string[]
): ExtendedBodyPart[] {
  const highlighted = new Set(highlightedMuscles);
  const parts: ExtendedBodyPart[] = [];

  function addPart(slug: string, size: number, sourceMuscle: string | null) {
    const intensity = sizeToIntensity(size);
    const isHighlighted = sourceMuscle !== null && highlighted.has(sourceMuscle);
    const part: ExtendedBodyPart = {
      slug: slug as any,
      intensity,
      ...(isHighlighted ? { color: highlightColor(intensity, bodyFatPercent) } : {}),
    };
    parts.push(part);
  }

  // Direct muscle-to-slug mappings
  for (const [muscle, slugs] of Object.entries(MUSCLE_TO_SLUGS)) {
    const size = muscles[muscle] ?? 0;
    for (const slug of slugs) {
      addPart(slug, size, muscle);
    }
  }

  // Derived slugs
  const coreSize = clamp(1 - bodyFatPercent / 30, 0, 1);
  addPart("abs", coreSize, null);
  addPart("obliques", coreSize, null);

  const backSize = muscles["back"] ?? 0;
  addPart("lower-back", backSize * 0.7, "back");

  const quadSize = muscles["quads"] ?? 0;
  addPart("adductors", quadSize * 0.5, "quads");

  const shoulderSize = muscles["shoulders"] ?? 0;
  addPart("neck", ((shoulderSize + backSize) / 2) * 0.3, null);

  const calfSize = muscles["calves"] ?? 0;
  addPart("tibialis", calfSize * 0.3, "calves");

  return parts;
}

// ── Component ────────────────────────────────────────────────────────

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

  const data = buildBodyData(muscles, bodyFatPercent, highlightedMuscles);
  const intensityColors = getIntensityColors(bodyFatPercent);
  const defaultFill = getDefaultFill(bodyFatPercent);
  const strokeOpacity = getStrokeOpacity(bodyFatPercent);
  const scale = Math.min(width / 220, height / 400) * 1.1;

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

        <Body
          data={data}
          colors={intensityColors}
          scale={scale}
          side={side}
          gender="male"
          onBodyPartPress={(part: ExtendedBodyPart) => {
            const slug = part.slug ?? "";
            const name = slugToDisplayName(slug);
            const sourceMuscle = SLUG_TO_MUSCLE[slug];
            const rawValue = sourceMuscle ? (muscles[sourceMuscle] ?? 0) : 0;
            setTooltip({ name, value: Math.round(rawValue * 100) });
            setTimeout(() => setTooltip(null), 2000);
          }}
          border="none"
          defaultFill={defaultFill}
          defaultStroke={`rgba(242, 240, 235, ${strokeOpacity})`}
          defaultStrokeWidth={0.5}
        />

        {/* Side label */}
        <Text style={styles.sideLabel}>
          {side === "front" ? "FRONT" : "BACK"}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

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
