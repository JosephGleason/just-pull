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

/** Convert a key like "bench_4" → "Bench (4 rep)" */
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
      <Text style={styles.sectionLabel}>Exercise</Text>
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
      <Text style={styles.sectionLabel}>Working Weights</Text>
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
                <Text style={styles.weightCardEmpty}>—</Text>
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
    backgroundColor: "#000",
  },
  content: {
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 20,
  },
  pickerScroll: {
    flexGrow: 0,
  },
  pickerList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  pillSelected: {
    backgroundColor: "#1C3A1F",
    borderColor: "#4CAF50",
  },
  pillText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  pillTextSelected: {
    color: "#4CAF50",
  },
  chartSection: {
    marginTop: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  weightCard: {
    width: "47%",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  weightCardName: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
    fontWeight: "500",
  },
  weightCardValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  weightCardUnit: {
    fontSize: 14,
    fontWeight: "400",
    color: "#888",
  },
  weightCardEmpty: {
    fontSize: 22,
    fontWeight: "800",
    color: "#444",
  },
});
