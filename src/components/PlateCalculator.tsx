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
import {
  calculatePlates,
  PlateInfo,
  LB_PLATES,
  KG_PLATES,
  LB_PLATE_COLORS,
  KG_PLATE_COLORS,
} from "../utils/plates";

interface PlateCalculatorProps {
  visible: boolean;
  weight: number;
  units: string;
  onClose: () => void;
}

interface VisualPlate extends PlateInfo {
  height: number;
  width: number;
}

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

export function PlateCalculator({
  visible,
  weight,
  units,
  onClose,
}: PlateCalculatorProps) {
  const barWeight = units === "kg" ? 20 : 45;
  const { plates: basePlates, error } = calculatePlates(weight, units);
  const maxPlate = (units === "kg" ? KG_PLATES : LB_PLATES)[0];
  const plates: VisualPlate[] = basePlates.map((p) => ({
    ...p,
    height: getPlateHeight(p.weight, maxPlate),
    width: getPlateWidth(p.weight, maxPlate),
  }));
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
