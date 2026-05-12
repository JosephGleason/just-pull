import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useAppContext } from "../../src/context";
import { COMPOUND_KEYS } from "../../src/program";
import { ProgressChart } from "../../src/components/ProgressChart";
import { colors, typography, spacing, radius } from "../../src/theme";

/** Convert a key like "bench_4" -> "Bench (4 rep)" */
function keyToDisplayName(key: string): string {
  const parts = key.split("_");
  // last part is typically a number
  const repNum = parts[parts.length - 1];
  const nameParts = parts.slice(0, parts.length - 1);
  const name = nameParts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return `${name} (${repNum} rep)`;
}

export default function ProgressScreen() {
  const { history, weights, settings } = useAppContext();
  const [selectedKey, setSelectedKey] = useState<string>(COMPOUND_KEYS[0]);

  const units = settings?.units ?? "lb";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Progress</Text>

      {/* Exercise Picker */}
      <Text style={styles.sectionLabel}>EXERCISE</Text>
      <FlatList
        data={COMPOUND_KEYS as unknown as string[]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.pickerList}
        renderItem={({ item }) => {
          const isSelected = item === selectedKey;
          return (
            <TouchableOpacity
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => setSelectedKey(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.pillText, isSelected && styles.pillTextSelected]}
              >
                {keyToDisplayName(item)}
              </Text>
            </TouchableOpacity>
          );
        }}
        style={styles.pickerScroll}
      />

      {/* Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>{keyToDisplayName(selectedKey)}</Text>
        <ProgressChart
          exerciseKey={selectedKey}
          history={history}
          units={units}
        />
      </View>

      {/* Working Weights Dashboard */}
      <Text style={styles.sectionLabel}>WORKING WEIGHTS</Text>
      <View style={styles.grid}>
        {(COMPOUND_KEYS as unknown as string[]).map((key) => {
          const ew = weights[key];
          const weight = ew?.working ?? null;
          return (
            <View key={key} style={styles.weightCard}>
              <Text style={styles.weightCardName} numberOfLines={1}>
                {keyToDisplayName(key)}
              </Text>
              {weight !== null ? (
                <Text style={styles.weightCardValue}>
                  {weight}{" "}
                  <Text style={styles.weightCardUnit}>{units}</Text>
                </Text>
              ) : (
                <Text style={styles.weightCardEmpty}>{"—"}</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 40,
  },
  screenTitle: {
    color: colors.text,
    ...typography.title,
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  pickerScroll: {
    flexGrow: 0,
  },
  pickerList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
  },
  pillSelected: {
    backgroundColor: colors.accent,
  },
  pillText: {
    color: colors.textSecondary,
    ...typography.bodyBold,
    fontSize: 13,
  },
  pillTextSelected: {
    color: colors.bg,
  },
  chartSection: {
    marginTop: spacing.md,
  },
  chartTitle: {
    color: colors.text,
    ...typography.subtitle,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md - 4,
    gap: spacing.sm,
  },
  weightCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
  },
  weightCardName: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  weightCardValue: {
    color: colors.text,
    ...typography.displaySmall,
  },
  weightCardUnit: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },
  weightCardEmpty: {
    color: colors.textTertiary,
    ...typography.displaySmall,
  },
});
