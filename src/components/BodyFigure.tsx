import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, Image } from "react-native";
import { colors as themeColors, typography } from "../theme";

interface BodyFigureProps {
  muscles: Record<string, number>;
  body_fat_percent: number;
  highlightedMuscles: string[];
  side: "front" | "back";
  onToggleSide: () => void;
  width: number;
  height: number;
}

const BF_IMAGES: { bf: number; source: any }[] = [
  { bf: 5, source: require("../../assets/body/bf_5.png") },
  { bf: 7, source: require("../../assets/body/bf_7.png") },
  { bf: 10, source: require("../../assets/body/bf_10.png") },
  { bf: 12, source: require("../../assets/body/bf_12.png") },
  { bf: 16, source: require("../../assets/body/bf_16.png") },
  { bf: 20, source: require("../../assets/body/bf_20.png") },
  { bf: 25, source: require("../../assets/body/bf_25.png") },
  { bf: 30, source: require("../../assets/body/bf_30.png") },
  { bf: 40, source: require("../../assets/body/bf_40.png") },
];

function getImagePair(body_fat_percent: number): {
  lower: (typeof BF_IMAGES)[0];
  upper: (typeof BF_IMAGES)[0];
  t: number;
} {
  const bf = Math.max(5, Math.min(40, body_fat_percent));

  for (let i = 0; i < BF_IMAGES.length - 1; i++) {
    if (bf <= BF_IMAGES[i + 1].bf) {
      const range = BF_IMAGES[i + 1].bf - BF_IMAGES[i].bf;
      const t = range > 0 ? (bf - BF_IMAGES[i].bf) / range : 0;
      return { lower: BF_IMAGES[i], upper: BF_IMAGES[i + 1], t };
    }
  }

  const last = BF_IMAGES[BF_IMAGES.length - 1];
  return { lower: last, upper: last, t: 0 };
}

export function BodyFigure({
  muscles,
  body_fat_percent,
  highlightedMuscles,
  side,
  onToggleSide,
  width,
  height,
}: BodyFigureProps) {
  const { lower, upper, t } = useMemo(
    () => getImagePair(body_fat_percent),
    [body_fat_percent]
  );

  const imageHeight = height * 0.95;
  const imageWidth = imageHeight * (158 / 491);

  return (
    <TouchableWithoutFeedback onPress={onToggleSide}>
      <View style={[styles.container, { width, height }]}>
        {/* Lower BF image (base) */}
        <Image
          source={lower.source}
          style={[
            styles.bodyImage,
            {
              width: imageWidth,
              height: imageHeight,
            },
          ]}
          resizeMode="contain"
        />

        {/* Upper BF image (crossfade on top) */}
        {t > 0.01 && lower.bf !== upper.bf && (
          <Image
            source={upper.source}
            style={[
              styles.bodyImage,
              styles.overlayImage,
              {
                width: imageWidth,
                height: imageHeight,
                opacity: t,
              },
            ]}
            resizeMode="contain"
          />
        )}

        {/* Side label */}
        <Text style={styles.sideLabel}>
          {side === "front" ? "FRONT" : "BACK"}
        </Text>
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
  bodyImage: {
    tintColor: themeColors.text,
  },
  overlayImage: {
    position: "absolute",
    tintColor: themeColors.text,
  },
  glowOverlay: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: themeColors.accentGlow,
    borderRadius: 100,
  },
  sideLabel: {
    ...typography.caption,
    color: themeColors.textTertiary,
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
  },
});
