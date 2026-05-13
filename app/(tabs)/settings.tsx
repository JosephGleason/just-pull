import React, { useState, useCallback } from "react";
import * as Crypto from "expo-crypto";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { profile$, cycle_state$, weights$, increments$, nutrition$, body_log$, workouts$, current_session$ } from "../../src/lib/store";
import { signOut, auth$ } from "../../src/lib/auth";
import { supabase } from "../../src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COMPOUND_KEYS } from "../../src/program";
import { calculateNutrition } from "../../src/hooks/useNutrition";
import {
  ProfileRow,
  CycleStateInput,
  ExerciseWeightInput,
  NutritionInput,
  IncrementRow,
  BodyLogRow,
  ActivityLevel,
  Goal,
  Units,
  WeekNumber,
  TrainingDay,
} from "../../src/types";
import { colors, typography, spacing, radius } from "../../src/theme";

// --- helpers ----------------------------------------------------------------

function keyToDisplayName(key: string): string {
  const lastUnderscore = key.lastIndexOf("_");
  const exercisePart = key.substring(0, lastUnderscore);
  const repsPart = key.substring(lastUnderscore + 1);
  const displayName = exercisePart
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  return `${displayName} (${repsPart} rep)`;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatBodyDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

// --- tiny shared components --------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue}>{value}</Text>
        <Text style={styles.rowChevron}>{"›"}</Text>
      </View>
    </TouchableOpacity>
  );
}

// --- edit modal --------------------------------------------------------------

interface EditModalProps {
  visible: boolean;
  title: string;
  initialValue: string;
  keyboardType?: "numeric" | "default";
  onSave: (val: string) => void;
  onCancel: () => void;
}

function EditModal({
  visible,
  title,
  initialValue,
  keyboardType = "numeric",
  onSave,
  onCancel,
}: EditModalProps) {
  const [value, setValue] = useState(initialValue);

  // reset when opened
  React.useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.modalInput}
            value={value}
            onChangeText={setValue}
            keyboardType={keyboardType}
            autoFocus
            selectTextOnFocus
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalCancelBtn]}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalSaveBtn]}
              onPress={() => onSave(value)}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- picker modal (simple list) ----------------------------------------------

interface PickerOption<T extends string> {
  label: string;
  value: T;
}

interface PickerModalProps<T extends string> {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selected: T;
  onSelect: (val: T) => void;
  onCancel: () => void;
}

function PickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onCancel,
}: PickerModalProps<T>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pickerOption,
                selected === opt.value && styles.pickerOptionSelected,
              ]}
              onPress={() => onSelect(opt.value)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  selected === opt.value && styles.pickerOptionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
              {selected === opt.value && (
                <Text style={styles.pickerCheck}>{"✓"}</Text>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.modalBtn, styles.modalCancelBtn, { marginTop: spacing.sm }]}
            onPress={onCancel}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// --- body log modal ----------------------------------------------------------

interface BodyLogModalProps {
  visible: boolean;
  units: Units;
  lastEntry: BodyLogRow | null;
  onSave: (weight: number, body_fat_percent: number) => void;
  onCancel: () => void;
}

function BodyLogModal({
  visible,
  units,
  lastEntry,
  onSave,
  onCancel,
}: BodyLogModalProps) {
  const [weightVal, setWeightVal] = useState("");
  const [bfVal, setBfVal] = useState("");

  React.useEffect(() => {
    if (visible) {
      setWeightVal(lastEntry ? String(lastEntry.weight) : "");
      setBfVal(lastEntry ? String(lastEntry.body_fat_percent) : "");
    }
  }, [visible, lastEntry]);

  function handleSave() {
    const parsedWeight = parseFloat(weightVal);
    const parsedBf = parseFloat(bfVal);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Invalid", "Please enter a valid body weight.");
      return;
    }
    const bf = isNaN(parsedBf) ? 0 : parsedBf;
    onSave(parsedWeight, bf);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={bodyLogStyles.overlay}
      >
        <View style={bodyLogStyles.box}>
          <Text style={bodyLogStyles.title}>Log Body Measurement</Text>

          <Text style={bodyLogStyles.inputLabel}>Body Weight ({units})</Text>
          <TextInput
            style={bodyLogStyles.input}
            value={weightVal}
            onChangeText={setWeightVal}
            keyboardType="numeric"
            placeholder="e.g. 185"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            selectTextOnFocus
          />

          <Text style={bodyLogStyles.inputLabel}>Body Fat %</Text>
          <TextInput
            style={bodyLogStyles.input}
            value={bfVal}
            onChangeText={setBfVal}
            keyboardType="numeric"
            placeholder="e.g. 18"
            placeholderTextColor={colors.textTertiary}
            selectTextOnFocus
          />

          <View style={bodyLogStyles.buttons}>
            <TouchableOpacity
              style={[bodyLogStyles.btn, bodyLogStyles.cancelBtn]}
              onPress={onCancel}
            >
              <Text style={bodyLogStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[bodyLogStyles.btn, bodyLogStyles.saveBtn]}
              onPress={handleSave}
            >
              <Text style={bodyLogStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const bodyLogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  box: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    color: colors.text,
    ...typography.subtitle,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 20,
    fontFamily: "PlusJakartaSans_400Regular",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: colors.surfaceTertiary,
  },
  cancelText: {
    color: colors.textSecondary,
    ...typography.bodyBold,
  },
  saveBtn: {
    backgroundColor: colors.accent,
  },
  saveText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
  },
});

// --- main screen -------------------------------------------------------------

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const profile = profile$.get() as ProfileRow | undefined;
  const cycleState = (cycle_state$.get() ?? null) as CycleStateInput | null;
  const weights = (weights$.get() ?? {}) as Record<string, ExerciseWeightInput>;
  const incrementsRecord = (increments$.get() ?? {}) as Record<string, IncrementRow>;
  const nutritionData = (nutrition$.get() ?? null) as NutritionInput | null;
  const bodyLogRecord = (body_log$.get() ?? {}) as Record<string, BodyLogRow>;
  const isLoading = !profile;

  // -- modal state --
  const [editModal, setEditModal] = useState<{
    visible: boolean;
    title: string;
    initialValue: string;
    onSave: (v: string) => void;
  }>({ visible: false, title: "", initialValue: "", onSave: () => {} });

  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    options: PickerOption<string>[];
    selected: string;
    onSelect: (v: string) => void;
  }>({
    visible: false,
    title: "",
    options: [],
    selected: "",
    onSelect: () => {},
  });

  // -- body log modal state --
  const [bodyLogModalVisible, setBodyLogModalVisible] = useState(false);
  const bodyLog: BodyLogRow[] = Object.values(bodyLogRecord).sort((a, b) => a.date.localeCompare(b.date));

  // -- nutrition local state (for the form) --
  const defaultNutrition: NutritionInput = {
    age: 30,
    weight: 180,
    height: 70,
    sex: "male",
    activity_level: "moderate",
    goal: "maintain",
  };

  const [nutritionForm, setNutritionForm] = useState<NutritionInput>(
    nutritionData ?? defaultNutrition
  );

  // Keep form in sync when data loads
  React.useEffect(() => {
    if (nutritionData) {
      setNutritionForm(nutritionData);
    }
  }, [nutritionData]);

  // -- helpers to open modals --
  const openEdit = useCallback(
    (title: string, initialValue: string, onSave: (v: string) => void) => {
      setEditModal({ visible: true, title, initialValue, onSave });
    },
    []
  );

  const closeEdit = useCallback(
    () => setEditModal((m) => ({ ...m, visible: false })),
    []
  );

  function openPicker<T extends string>(
    title: string,
    options: PickerOption<T>[],
    selected: T,
    onSelect: (v: T) => void
  ) {
    setPickerModal({
      visible: true,
      title,
      options: options as PickerOption<string>[],
      selected,
      onSelect: onSelect as (v: string) => void,
    });
  }

  const closePicker = useCallback(
    () => setPickerModal((m) => ({ ...m, visible: false })),
    []
  );

  // -- guard --
  if (isLoading || !profile || !cycleState) {
    return (
      <View style={styles.centered}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : (
          <Text style={styles.emptyText}>
            Complete onboarding to access settings.
          </Text>
        )}
      </View>
    );
  }

  // After the guard, these are guaranteed non-null; capture for closure safety.
  const safeProfile: ProfileRow = profile;
  const safeCycleState: CycleStateInput = cycleState;

  // -- section handlers --

  // Weights
  function handleEditWeight(key: string) {
    const current = weights[key]?.working ?? 0;
    openEdit(
      `Working Weight — ${keyToDisplayName(key)}`,
      String(current),
      (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          Alert.alert("Invalid", "Please enter a positive number.");
          return;
        }
        const existing = weights[key];
        weights$[key].set({
          ...(existing ?? { exercise_key: key, pr: null, pr_status: null }),
          working: num,
        } as any);
        closeEdit();
      }
    );
  }

  // Increments
  function handleEditIncrement(key: string) {
    const current = incrementsRecord[key]?.increment ?? 5;
    openEdit(
      `Increment — ${keyToDisplayName(key)}`,
      String(current),
      (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          Alert.alert("Invalid", "Please enter a positive number.");
          return;
        }
        const existing = incrementsRecord[key];
        increments$[key].set({
          ...(existing ?? { exercise_key: key }),
          increment: num,
        } as any);
        closeEdit();
      }
    );
  }

  // Rest timers
  function handleEditRestTimer(field: "rest_timer_compound" | "rest_timer_accessory") {
    const label = field === "rest_timer_compound" ? "Compound Rest" : "Accessory Rest";
    const current = safeProfile[field];
    openEdit(`${label} (seconds)`, String(current), (val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) {
        Alert.alert("Invalid", "Please enter a non-negative number.");
        return;
      }
      profile$[field].set(num);
      closeEdit();
    });
  }

  // Units
  function handleUnitsChange(units: Units) {
    profile$.units.set(units);
  }

  // Cycle state
  function handleEditCycleField(
    field: "cycle_number" | "week_number" | "next_day"
  ) {
    const labels: Record<string, string> = {
      cycle_number: "Cycle Number",
      week_number: "Week (1-3)",
      next_day: "Next Day (1, 2, 3, 5, or 6)",
    };
    const current = safeCycleState[field];
    openEdit(labels[field], String(current), (val) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) {
        Alert.alert("Invalid", "Please enter a valid number.");
        return;
      }
      if (field === "cycle_number") cycle_state$.cycle_number.set(Math.max(1, num));
      if (field === "week_number")
        cycle_state$.week_number.set(Math.max(1, Math.min(3, num)) as WeekNumber);
      if (field === "next_day") {
        const valid: TrainingDay[] = [1, 2, 3, 5, 6];
        if (!valid.includes(num as TrainingDay)) {
          Alert.alert("Invalid", "Day must be 1, 2, 3, 5, or 6.");
          return;
        }
        cycle_state$.next_day.set(num as TrainingDay);
      }
      closeEdit();
    });
  }

  // Nutrition form helpers
  function updateNutritionField<K extends keyof NutritionInput>(
    field: K,
    value: NutritionInput[K]
  ) {
    setNutritionForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSaveNutrition() {
    if (
      !nutritionForm.age ||
      !nutritionForm.weight ||
      !nutritionForm.height
    ) {
      Alert.alert("Incomplete", "Please fill in age, weight, and height.");
      return;
    }
    nutrition$.set(nutritionForm as any);
    Alert.alert("Saved", "Nutrition settings updated.");
  }

  function handleClearNutrition() {
    Alert.alert("Clear Nutrition", "Remove nutrition data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          nutrition$.set(null as any);
          setNutritionForm(defaultNutrition);
        },
      },
    ]);
  }

  // Data export/import
  async function handleExport() {
    try {
      const data = {
        profile: profile$.get(),
        nutrition: nutrition$.get(),
        cycle_state: cycle_state$.get(),
        weights: weights$.get(),
        increments: increments$.get(),
        workouts: workouts$.get(),
        body_log: body_log$.get(),
      };
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json });
    } catch (e: any) {
      Alert.alert("Export failed", e.message ?? String(e));
    }
  }

  function handleImport() {
    Alert.alert(
      "Import Data",
      "Paste JSON import is not yet supported in this version. Export your data from another device and paste it here in a future update.",
      [{ text: "OK" }]
    );
  }

  // -- computed --
  const nutritionTargets =
    nutritionData
      ? calculateNutrition(nutritionData, safeProfile.units)
      : null;

  const formTargets = calculateNutrition(nutritionForm, safeProfile.units);

  // -- render -----------------------------------------------------------------

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >

        {/* -- 1. Working Weights -- */}
        <SectionHeader title="Working Weights" />
        <View style={styles.card}>
          {COMPOUND_KEYS.map((key, i) => (
            <View key={key}>
              {i > 0 && <View style={styles.divider} />}
              <SettingsRow
                label={keyToDisplayName(key)}
                value={`${weights[key]?.working ?? "—"} ${safeProfile.units}`}
                onPress={() => handleEditWeight(key)}
              />
            </View>
          ))}
        </View>

        {/* -- 2. Increments -- */}
        <SectionHeader title="Weight Increments" />
        <View style={styles.card}>
          {COMPOUND_KEYS.map((key, i) => (
            <View key={key}>
              {i > 0 && <View style={styles.divider} />}
              <SettingsRow
                label={keyToDisplayName(key)}
                value={`${incrementsRecord[key]?.increment ?? 5} ${safeProfile.units}`}
                onPress={() => handleEditIncrement(key)}
              />
            </View>
          ))}
        </View>

        {/* -- 3. Rest Timer -- */}
        <SectionHeader title="Rest Timer" />
        <View style={styles.card}>
          <SettingsRow
            label="Compound"
            value={formatSeconds(safeProfile.rest_timer_compound)}
            onPress={() => handleEditRestTimer("rest_timer_compound")}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Accessory"
            value={formatSeconds(safeProfile.rest_timer_accessory)}
            onPress={() => handleEditRestTimer("rest_timer_accessory")}
          />
        </View>

        {/* -- 4. Units -- */}
        <SectionHeader title="Units" />
        <View style={styles.card}>
          <View style={styles.segmentRow}>
            {(["lb", "kg"] as Units[]).map((u) => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.segmentBtn,
                  safeProfile.units === u && styles.segmentBtnActive,
                ]}
                onPress={() => handleUnitsChange(u)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    safeProfile.units === u && styles.segmentTextActive,
                  ]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.unitsNote}>
            Changing units does not convert existing weights.
          </Text>
        </View>

        {/* -- 5. Cycle Position -- */}
        <SectionHeader title="Cycle Position" />
        <View style={styles.card}>
          <SettingsRow
            label="Cycle"
            value={String(safeCycleState.cycle_number)}
            onPress={() => handleEditCycleField("cycle_number")}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Week"
            value={String(safeCycleState.week_number)}
            onPress={() => handleEditCycleField("week_number")}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Next Day"
            value={String(safeCycleState.next_day)}
            onPress={() => handleEditCycleField("next_day")}
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Deload</Text>
            <TouchableOpacity
              style={[
                styles.deloadToggle,
                safeCycleState.is_deload && styles.deloadToggleActive,
              ]}
              onPress={() =>
                cycle_state$.is_deload.set(!safeCycleState.is_deload)
              }
            >
              <Text
                style={[
                  styles.deloadToggleText,
                  safeCycleState.is_deload && styles.deloadToggleTextActive,
                ]}
              >
                {safeCycleState.is_deload ? "On" : "Off"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* -- 6. Nutrition Calculator -- */}
        <SectionHeader title="Nutrition Calculator" />
        <View style={styles.card}>
          {/* Current saved targets */}
          {nutritionData && nutritionTargets && (
            <View style={styles.nutritionTargetsRow}>
              <NutritionBadge label="kcal" value={nutritionTargets.calories} color={colors.accent} />
              <NutritionBadge label="protein" value={nutritionTargets.protein} color={colors.green} />
              <NutritionBadge label="carbs" value={nutritionTargets.carbs} color={colors.accentDim} />
              <NutritionBadge label="fat" value={nutritionTargets.fat} color={colors.red} />
            </View>
          )}

          {/* Age */}
          <View style={styles.nutritionField}>
            <Text style={styles.nutritionLabel}>Age</Text>
            <TouchableOpacity
              style={styles.nutritionValueBtn}
              onPress={() =>
                openEdit("Age (years)", String(nutritionForm.age), (v) => {
                  const n = parseInt(v, 10);
                  if (!isNaN(n) && n > 0) updateNutritionField("age", n);
                  closeEdit();
                })
              }
            >
              <Text style={styles.nutritionValueText}>{nutritionForm.age}</Text>
            </TouchableOpacity>
          </View>

          {/* Weight */}
          <View style={styles.divider} />
          <View style={styles.nutritionField}>
            <Text style={styles.nutritionLabel}>
              Weight ({safeProfile.units})
            </Text>
            <TouchableOpacity
              style={styles.nutritionValueBtn}
              onPress={() =>
                openEdit(
                  `Body Weight (${safeProfile.units})`,
                  String(nutritionForm.weight),
                  (v) => {
                    const n = parseFloat(v);
                    if (!isNaN(n) && n > 0) updateNutritionField("weight", n);
                    closeEdit();
                  }
                )
              }
            >
              <Text style={styles.nutritionValueText}>
                {nutritionForm.weight}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Height */}
          <View style={styles.divider} />
          <View style={styles.nutritionField}>
            <Text style={styles.nutritionLabel}>
              Height ({safeProfile.units === "lb" ? "in" : "cm"})
            </Text>
            <TouchableOpacity
              style={styles.nutritionValueBtn}
              onPress={() =>
                openEdit(
                  `Height (${safeProfile.units === "lb" ? "inches" : "cm"})`,
                  String(nutritionForm.height),
                  (v) => {
                    const n = parseFloat(v);
                    if (!isNaN(n) && n > 0) updateNutritionField("height", n);
                    closeEdit();
                  }
                )
              }
            >
              <Text style={styles.nutritionValueText}>
                {nutritionForm.height}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sex */}
          <View style={styles.divider} />
          <View style={styles.nutritionField}>
            <Text style={styles.nutritionLabel}>Sex</Text>
            <TouchableOpacity
              style={styles.nutritionValueBtn}
              onPress={() =>
                openPicker(
                  "Sex",
                  [
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                  ],
                  nutritionForm.sex,
                  (v) => {
                    updateNutritionField("sex", v as "male" | "female");
                    closePicker();
                  }
                )
              }
            >
              <Text style={styles.nutritionValueText}>
                {nutritionForm.sex === "male" ? "Male" : "Female"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Activity Level */}
          <View style={styles.divider} />
          <View style={styles.nutritionField}>
            <Text style={styles.nutritionLabel}>Activity</Text>
            <TouchableOpacity
              style={styles.nutritionValueBtn}
              onPress={() =>
                openPicker(
                  "Activity Level",
                  [
                    { label: "Sedentary", value: "sedentary" },
                    { label: "Lightly Active", value: "light" },
                    { label: "Moderately Active", value: "moderate" },
                    { label: "Very Active", value: "active" },
                    { label: "Extremely Active", value: "very_active" },
                  ],
                  nutritionForm.activity_level,
                  (v) => {
                    updateNutritionField("activity_level", v as ActivityLevel);
                    closePicker();
                  }
                )
              }
            >
              <Text style={styles.nutritionValueText}>
                {activityLabel(nutritionForm.activity_level)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Goal */}
          <View style={styles.divider} />
          <View style={styles.nutritionField}>
            <Text style={styles.nutritionLabel}>Goal</Text>
            <TouchableOpacity
              style={styles.nutritionValueBtn}
              onPress={() =>
                openPicker(
                  "Goal",
                  [
                    { label: "Bulk (+400 kcal)", value: "bulk" },
                    { label: "Maintain", value: "maintain" },
                    { label: "Cut (-400 kcal)", value: "cut" },
                  ],
                  nutritionForm.goal,
                  (v) => {
                    updateNutritionField("goal", v as Goal);
                    closePicker();
                  }
                )
              }
            >
              <Text style={styles.nutritionValueText}>
                {goalLabel(nutritionForm.goal)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.divider} />
          <View style={styles.nutritionPreview}>
            <Text style={styles.nutritionPreviewTitle}>PREVIEW</Text>
            <View style={styles.nutritionTargetsRow}>
              <NutritionBadge label="kcal" value={formTargets.calories} color={colors.accent} />
              <NutritionBadge label="protein" value={formTargets.protein} color={colors.green} />
              <NutritionBadge label="carbs" value={formTargets.carbs} color={colors.accentDim} />
              <NutritionBadge label="fat" value={formTargets.fat} color={colors.red} />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.nutritionActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.clearBtn]}
              onPress={handleClearNutrition}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn]}
              onPress={handleSaveNutrition}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* -- 7. Body Measurements -- */}
        <SectionHeader title="Body Measurements" />
        <View style={styles.card}>
          {/* Log button */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setBodyLogModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Log Measurement</Text>
            <View style={styles.rowValueWrap}>
              <Text style={styles.rowChevron}>{"+"}</Text>
            </View>
          </TouchableOpacity>

          {/* History entries */}
          {bodyLog.length > 0 && <View style={styles.divider} />}
          {[...bodyLog].reverse().map((entry, i) => (
            <View key={entry.date + i}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.bodyLogRow}
                activeOpacity={0.7}
                onLongPress={() => {
                  Alert.alert(
                    "Delete Entry",
                    `Remove log for ${formatBodyDate(entry.date)}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          body_log$[entry.id].delete();
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.bodyLogDate}>{formatBodyDate(entry.date)}</Text>
                <Text style={styles.bodyLogValues}>
                  {entry.weight} {safeProfile.units}
                  {entry.body_fat_percent > 0 ? `  ·  ${entry.body_fat_percent}% BF` : ""}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* -- 8. Data -- */}
        <SectionHeader title="Data" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dataBtn}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <Text style={styles.dataBtnText}>Export Data</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.dataBtn}
            onPress={handleImport}
            activeOpacity={0.7}
          >
            <Text style={[styles.dataBtnText, styles.dataBtnTextMuted]}>
              Import Data
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.dataBtn}
            onPress={() => {
              Alert.alert(
                "Clear All Data",
                "This will delete all workout history, weights, and settings. You'll need to go through onboarding again. This cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear Everything",
                    style: "destructive",
                    onPress: async () => {
                      const uid = auth$.uid.get();
                      if (uid) {
                        await supabase.from("exercise_weights").delete().eq("user_id", uid);
                        await supabase.from("increments").delete().eq("user_id", uid);
                        await supabase.from("workouts").delete().eq("user_id", uid);
                        await supabase.from("body_log").delete().eq("user_id", uid);
                        await supabase.from("current_session").delete().eq("id", uid);
                        await supabase.from("nutrition_settings").delete().eq("id", uid);
                        await supabase.from("cycle_state").delete().eq("id", uid);
                        await supabase.from("profiles").update({ onboarding_complete: false }).eq("id", uid);
                      }
                      await AsyncStorage.multiRemove([
                        "ls_profiles", "ls_profiles__m",
                        "ls_nutrition", "ls_nutrition__m",
                        "ls_cycle_state", "ls_cycle_state__m",
                        "ls_current_session", "ls_current_session__m",
                        "ls_exercise_weights", "ls_exercise_weights__m",
                        "ls_increments", "ls_increments__m",
                        "ls_workouts", "ls_workouts__m",
                        "ls_body_log", "ls_body_log__m",
                      ]);
                      await signOut();
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.dataBtnText, { color: colors.red }]}>
              Clear All Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* -- 9. Account -- */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dataBtn}
            onPress={() => {
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign Out",
                  onPress: async () => {
                    await signOut();
                  },
                },
              ]);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dataBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Edit Modal */}
      <EditModal
        visible={editModal.visible}
        title={editModal.title}
        initialValue={editModal.initialValue}
        onSave={editModal.onSave}
        onCancel={closeEdit}
      />

      {/* Picker Modal */}
      <PickerModal
        visible={pickerModal.visible}
        title={pickerModal.title}
        options={pickerModal.options}
        selected={pickerModal.selected}
        onSelect={pickerModal.onSelect}
        onCancel={closePicker}
      />

      {/* Body Log Modal */}
      <BodyLogModal
        visible={bodyLogModalVisible}
        units={safeProfile.units}
        lastEntry={bodyLog.length > 0 ? bodyLog[bodyLog.length - 1] : null}
        onSave={(weight, bf) => {
          const id = Crypto.randomUUID();
          body_log$[id].set({
            date: new Date().toISOString().split("T")[0],
            weight,
            body_fat_percent: bf,
          } as any);
          setBodyLogModalVisible(false);
        }}
        onCancel={() => setBodyLogModalVisible(false)}
      />
    </View>
  );
}

// --- mini badge component ----------------------------------------------------

function NutritionBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeValue, { color }]}>{value}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

// --- label helpers -----------------------------------------------------------

function activityLabel(a: ActivityLevel): string {
  const m: Record<ActivityLevel, string> = {
    sedentary: "Sedentary",
    light: "Lightly Active",
    moderate: "Moderate",
    active: "Very Active",
    very_active: "Extremely Active",
  };
  return m[a] ?? a;
}

function goalLabel(g: Goal): string {
  const m: Record<Goal, string> = {
    bulk: "Bulk",
    maintain: "Maintain",
    cut: "Cut",
  };
  return m[g] ?? g;
}

// --- styles ------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },

  // section header
  sectionHeader: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    ...typography.caption,
  },

  // card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },

  // row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLabel: {
    color: colors.text,
    ...typography.body,
    flex: 1,
  },
  rowValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    color: colors.textSecondary,
    ...typography.body,
  },
  rowChevron: {
    color: colors.textTertiary,
    fontSize: 20,
    lineHeight: 22,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },

  // units segment control
  segmentRow: {
    flexDirection: "row",
    margin: spacing.md,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.surfaceTertiary,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  segmentTextActive: {
    color: colors.bg,
  },
  unitsNote: {
    color: colors.textTertiary,
    ...typography.micro,
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
    textAlign: "center",
  },

  // deload toggle
  deloadToggle: {
    paddingHorizontal: 18,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
  },
  deloadToggleActive: {
    backgroundColor: colors.accent,
  },
  deloadToggleText: {
    color: colors.textSecondary,
    ...typography.bodyBold,
    fontSize: 14,
  },
  deloadToggleTextActive: {
    color: colors.bg,
  },

  // nutrition fields
  nutritionField: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  nutritionLabel: {
    color: colors.text,
    ...typography.body,
    flex: 1,
  },
  nutritionValueBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    minWidth: 72,
    alignItems: "center",
  },
  nutritionValueText: {
    color: colors.accent,
    ...typography.bodyBold,
  },

  // nutrition preview
  nutritionPreview: {
    padding: spacing.md,
  },
  nutritionPreviewTitle: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.md,
  },
  nutritionTargetsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },

  // badge
  badge: {
    alignItems: "center",
    minWidth: 64,
  },
  badgeValue: {
    ...typography.displaySmall,
  },
  badgeLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    marginTop: 2,
  },

  // nutrition action buttons
  nutritionActions: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  clearBtn: {
    backgroundColor: colors.surfaceTertiary,
  },
  clearBtnText: {
    color: colors.red,
    ...typography.bodyBold,
  },
  saveBtn: {
    backgroundColor: colors.accent,
  },
  saveBtnText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
  },

  // data
  dataBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
    justifyContent: "center",
  },
  dataBtnText: {
    color: colors.accent,
    ...typography.body,
  },
  dataBtnTextMuted: {
    color: colors.textTertiary,
  },

  // edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.text,
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 20,
    fontFamily: "PlusJakartaSans_400Regular",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  modalCancelBtn: {
    backgroundColor: colors.surfaceTertiary,
  },
  modalCancelText: {
    color: colors.textSecondary,
    ...typography.bodyBold,
  },
  modalSaveBtn: {
    backgroundColor: colors.accent,
  },
  modalSaveText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
  },

  // body log history rows
  bodyLogRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
  },
  bodyLogDate: {
    color: colors.text,
    ...typography.body,
  },
  bodyLogValues: {
    color: colors.textSecondary,
    ...typography.body,
  },

  // picker modal
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  pickerOptionSelected: {
    // subtle tint
  },
  pickerOptionText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  pickerOptionTextSelected: {
    color: colors.accent,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  pickerCheck: {
    color: colors.accent,
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
