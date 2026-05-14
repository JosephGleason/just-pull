import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius, fonts } from "../theme";

interface PlateCalculatorProps {
  visible: boolean;
  weight: number;
  units: string;
  onClose: () => void;
}

interface PlateInfo {
  weight: number;
  color: string;
  height: number;
  width: number;
}

const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const LB_PLATE_COLORS: Record<number, string> = {
  45: "#E85454",
  35: "#4A8FE8",
  25: "#5BD488",
  10: "#E8A838",
  5: "#F2F0EB",
  2.5: "#8A897F",
};

const KG_PLATE_COLORS: Record<number, string> = {
  25: "#E85454",
  20: "#4A8FE8",
  15: "#E8A838",
  10: "#5BD488",
  5: "#F2F0EB",
  2.5: "#8A897F",
  1.25: colors.textTertiary,
};

function getPlateHeight(plateWeight: number, maxPlate: number): number {
  const minHeight = 32;
  const maxHeight = 80;
  const ratio = plateWeight / maxPlate;
  return Math.round(minHeight + ratio * (maxHeight - minHeight));
}

function getPlateWidth(plateWeight: number, maxPlate: number): number {
  const minWidth = 18;
  const maxWidth = 28;
  const ratio = plateWeight / maxPlate;
  return Math.round(minWidth + ratio * (maxWidth - minWidth));
}

function calculatePlates(
  weight: number,
  units: string
): { plates: PlateInfo[]; error: string | null } {
  const barWeight = units === "kg" ? 20 : 45;
  const availablePlates = units === "kg" ? KG_PLATES : LB_PLATES;
  const plateColors = units === "kg" ? KG_PLATE_COLORS : LB_PLATE_COLORS;
  const maxPlate = availablePlates[0];

  if (weight <= barWeight) {
    return { plates: [], error: "Bar only" };
  }

  const remainder = weight - barWeight;
  if (remainder % 2 !== 0 && units === "lb") {
    // Check if it can be split — for lb plates with 2.5lb minimum, remainder must be divisible by 5 total (2.5 per side)
    const perSide = remainder / 2;
    // 2.5lb is the smallest plate, so perSide must be achievable with 2.5 increments
    if (perSide !== Math.floor(perSide * 2) / 2) {
      return { plates: [], error: "Can't split evenly" };
    }
  }

  const perSide = remainder / 2;

  // Check if perSide can actually be achieved
  if (perSide < 0) {
    return { plates: [], error: "Bar only" };
  }

  // For kg, smallest plate is 1.25, so perSide must be achievable in 1.25 increments
  // For lb, smallest plate is 2.5, so perSide must be achievable in 2.5 increments
  const smallestPlate = availablePlates[availablePlates.length - 1];
  const canSplit = (perSide * 10) % (smallestPlate * 10) === 0;
  if (!canSplit) {
    return { plates: [], error: "Can't split evenly" };
  }

  const plates: PlateInfo[] = [];
  let remaining = perSide;

  for (const plate of availablePlates) {
    while (remaining >= plate) {
      plates.push({
        weight: plate,
        color: plateColors[plate] ?? colors.textTertiary,
        height: getPlateHeight(plate, maxPlate),
        width: getPlateWidth(plate, maxPlate),
      });
      remaining -= plate;
    }
  }

  return { plates, error: null };
}

export function PlateCalculator({
  visible,
  weight,
  units,
  onClose,
}: PlateCalculatorProps) {
  const barWeight = units === "kg" ? 20 : 45;
  const { plates, error } = calculatePlates(weight, units);
  const perSideWeight = weight > barWeight ? (weight - barWeight) / 2 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>PLATE CALCULATOR</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Total weight */}
          <Text style={styles.totalWeight}>
            {weight}
            <Text style={styles.totalWeightUnit}> {units}</Text>
          </Text>

          {/* Bar weight info */}
          <Text style={styles.barInfo}>
            Bar: {barWeight} {units}
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <>
              {/* Per side label */}
              <View style={styles.perSideHeader}>
                <Text style={styles.perSideLabel}>PER SIDE</Text>
                <Text style={styles.perSideWeight}>
                  {perSideWeight}
                  <Text style={styles.perSideUnit}> {units}</Text>
                </Text>
              </View>

              {/* Barbell diagram */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.barbellContainer}
              >
                {/* Bar end */}
                <View style={styles.barEnd} />

                {/* Plates */}
                {plates.map((plate, index) => (
                  <View
                    key={index}
                    style={[
                      styles.plate,
                      {
                        backgroundColor: plate.color,
                        height: plate.height,
                        width: plate.width,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.plateLabel,
                        {
                          color:
                            plate.color === "#F2F0EB" ||
                            plate.color === "#8A897F"
                              ? colors.bg
                              : colors.text,
                          fontSize: plate.width < 22 ? 7 : 9,
                        },
                      ]}
                    >
                      {plate.weight}
                    </Text>
                  </View>
                ))}

                {/* Bar shaft */}
                <View style={styles.barShaft} />
              </ScrollView>

              {/* Plate summary list */}
              <View style={styles.summaryList}>
                {(() => {
                  const counts: Record<number, number> = {};
                  for (const p of plates) {
                    counts[p.weight] = (counts[p.weight] ?? 0) + 1;
                  }
                  return Object.entries(counts).map(([w, count]) => (
                    <View key={w} style={styles.summaryRow}>
                      <View
                        style={[
                          styles.summaryDot,
                          {
                            backgroundColor:
                              (units === "kg"
                                ? KG_PLATE_COLORS
                                : LB_PLATE_COLORS)[Number(w)] ??
                              colors.textTertiary,
                          },
                        ]}
                      />
                      <Text style={styles.summaryText}>
                        {w} {units}
                      </Text>
                      <Text style={styles.summaryCount}>x{count}</Text>
                    </View>
                  ));
                })()}
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 0,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 340,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  totalWeight: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 58,
    textAlign: "center",
  },
  totalWeightUnit: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textTertiary,
  },
  barInfo: {
    color: colors.textTertiary,
    ...typography.micro,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  errorText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  perSideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  perSideLabel: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  perSideWeight: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 24,
  },
  perSideUnit: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.textTertiary,
  },
  barbellContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  barEnd: {
    width: 8,
    height: 16,
    backgroundColor: colors.textTertiary,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  plate: {
    borderRadius: 0,
    marginLeft: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  plateLabel: {
    fontFamily: fonts.medium,
    textAlign: "center",
  },
  barShaft: {
    height: 6,
    width: 60,
    backgroundColor: colors.textTertiary,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    marginLeft: 2,
  },
  summaryList: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 0,
  },
  summaryText: {
    color: colors.textSecondary,
    ...typography.body,
    flex: 1,
  },
  summaryCount: {
    color: colors.text,
    ...typography.bodyBold,
  },
});
