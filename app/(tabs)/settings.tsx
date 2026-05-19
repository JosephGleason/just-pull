import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { useSelector } from "@legendapp/state/react";
import { profile$, cycle_state$, weights$, increments$, nutrition$, body_log$, workouts$, current_session$, clearLocalStores } from "../../src/lib/store";
import { signOut, auth$ } from "../../src/lib/auth";
import { supabase } from "../../src/lib/supabase";
import { ALL_EXERCISE_KEYS } from "../../src/program";
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
import { colors, fonts, typography, spacing } from "../../src/theme";
import { formatTime } from "../../src/utils/date";

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

function formatBodyDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

// --- FORGE section components ------------------------------------------------

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
  danger,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      {value !== undefined && (
        <Text style={[styles.rowValue, danger && styles.dangerText]}>{value}</Text>
      )}
    </TouchableOpacity>
  );
}

function StaticRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
              <Text style={styles.modalCancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalSaveBtn]}
              onPress={() => onSave(value)}
            >
              <Text style={styles.modalSaveText}>SAVE</Text>
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
                <Text style={styles.pickerCheck}>{">"}</Text>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.modalBtn, styles.modalCancelBtn, { marginTop: 16 }]}
            onPress={onCancel}
          >
            <Text style={styles.modalCancelText}>CANCEL</Text>
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
        style={styles.modalOverlay}
      >
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>LOG BODY MEASUREMENT</Text>

          <Text style={styles.modalInputLabel}>BODY WEIGHT ({units.toUpperCase()})</Text>
          <TextInput
            style={styles.modalInput}
            value={weightVal}
            onChangeText={setWeightVal}
            keyboardType="numeric"
            placeholder="e.g. 185"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            selectTextOnFocus
          />

          <Text style={styles.modalInputLabel}>BODY FAT %</Text>
          <TextInput
            style={styles.modalInput}
            value={bfVal}
            onChangeText={setBfVal}
            keyboardType="numeric"
            placeholder="e.g. 18"
            placeholderTextColor={colors.textTertiary}
            selectTextOnFocus
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalCancelBtn]}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalSaveBtn]}
              onPress={handleSave}
            >
              <Text style={styles.modalSaveText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- main screen -------------------------------------------------------------

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const profile = useSelector(profile$) as ProfileRow | undefined;
  const cycleState = (useSelector(cycle_state$) ?? null) as CycleStateInput | null;
  const weights = (useSelector(weights$) ?? {}) as Record<string, ExerciseWeightInput>;
  const incrementsRecord = (useSelector(increments$) ?? {}) as Record<string, IncrementRow>;
  const nutritionData = (useSelector(nutrition$) ?? null) as NutritionInput | null;
  const bodyLogRecord = (useSelector(body_log$) ?? {}) as Record<string, BodyLogRow>;
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
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [lastSavedBodyLog, setLastSavedBodyLog] = useState<{ weight: number; body_fat_percent: number } | null>(null);
  const bodyLog: BodyLogRow[] = useMemo(() =>
    Object.values(bodyLogRecord).sort((a, b) => a.date.localeCompare(b.date)),
    [bodyLogRecord]
  );

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
          ...(existing ?? { exercise_key: key, pr: null, pr_status: null, fail_count: 0 }),
          working: num,
          user_id: auth$.uid.get(),
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
          user_id: auth$.uid.get(),
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

  // Data export
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

  // Clear all data
  function handleClearAllData() {
    const doClear = async () => {
      try {
        const uid = auth$.uid.get();
        if (uid) {
          const deletes = [
            supabase.from("exercise_weights").delete().eq("user_id", uid),
            supabase.from("increments").delete().eq("user_id", uid),
            supabase.from("workouts").delete().eq("user_id", uid),
            supabase.from("body_log").delete().eq("user_id", uid),
            supabase.from("current_session").delete().eq("id", uid),
            supabase.from("nutrition_settings").delete().eq("id", uid),
            supabase.from("cycle_state").delete().eq("id", uid),
          ];
          const results = await Promise.all(deletes);
          const failures = results.filter((r) => r.error);
          if (failures.length > 0) {
            Alert.alert("Warning", "Some data could not be deleted from the server. Please try again with a network connection.");
            return;
          }
          await supabase.from("profiles").update({ onboarding_complete: false }).eq("id", uid);
        }
        await clearLocalStores();
        await signOut();
      } catch {
        Alert.alert("Error", "Failed to clear data. Please check your connection and try again.");
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm("This will delete all data. This cannot be undone. Continue?")) {
        doClear();
      }
    } else {
      Alert.alert(
        "Clear All Data",
        "This will delete all workout history, weights, and settings. You'll need to go through onboarding again. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear Everything", style: "destructive", onPress: doClear },
        ]
      );
    }
  }

  // Sign out
  function handleSignOut() {
    const doSignOut = async () => {
      await clearLocalStores();
      await signOut();
    };
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        doSignOut();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", onPress: doSignOut },
      ]);
    }
  }

  // -- computed --
  const totalWeeks = 3;
  const cyclesUntilDeload = 3 - (safeCycleState.cycle_number % 3 || 3);
  const daysUntilDeload = cyclesUntilDeload * 15;
  const latestBodyLog = lastSavedBodyLog ?? (bodyLog.length > 0 ? bodyLog[bodyLog.length - 1] : null);

  // Cache auth uid
  const uid = auth$.uid.get();

  // Nutrition preview (replaces IIFE in modal)
  const nutritionPreview = useMemo(
    () => calculateNutrition(nutritionForm, safeProfile.units),
    [nutritionForm, safeProfile.units]
  );

  // Pending action to run after a modal close animation completes.
  // We store the callback in a ref and trigger it via useEffect when
  // the modal visibility state changes to false, avoiding setTimeout races.
  const pendingModalActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!showNutritionModal && pendingModalActionRef.current) {
      const action = pendingModalActionRef.current;
      pendingModalActionRef.current = null;
      // requestAnimationFrame ensures the modal's close animation has
      // completed and the next frame is rendered before opening a new modal.
      requestAnimationFrame(action);
    }
  }, [showNutritionModal]);

  useEffect(() => {
    if (!showWeightsModal && pendingModalActionRef.current) {
      const action = pendingModalActionRef.current;
      pendingModalActionRef.current = null;
      requestAnimationFrame(action);
    }
  }, [showWeightsModal]);

  function closeNutritionThen(fn: () => void) {
    pendingModalActionRef.current = fn;
    setShowNutritionModal(false);
  }

  // -- render -----------------------------------------------------------------

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── HEADER SLAB ── */}
        <View style={styles.headerSlab}>
          <Text style={styles.headerLabel}>SETTINGS</Text>
          <Text style={styles.headerDisplay}>
            LIFTER<Text style={styles.accentDot}>.</Text>
          </Text>
          {uid ? (
            <Text style={styles.headerEmail}>{uid.substring(0, 8).toUpperCase()}</Text>
          ) : null}
          <View style={styles.hairline} />
        </View>

        {/* ── LIFTER ── */}
        <SectionHeader title="LIFTER" />
        <View>
          <SettingsRow
            label="BODYWEIGHT"
            value={latestBodyLog ? `${latestBodyLog.weight} ${safeProfile.units.toUpperCase()}` : `— ${safeProfile.units.toUpperCase()}`}
            onPress={() => setBodyLogModalVisible(true)}
          />
          <SettingsRow
            label="UNITS"
            value={safeProfile.units === "lb" ? "IMPERIAL" : "METRIC"}
            onPress={() => handleUnitsChange(safeProfile.units === "lb" ? "kg" : "lb")}
          />
        </View>

        {/* ── PROGRAM ── */}
        <SectionHeader title="PROGRAM" />
        <View>
          <SettingsRow
            label="CURRENT CYCLE"
            value={`${safeCycleState.cycle_number} · WK ${safeCycleState.week_number}/${totalWeeks}`}
            onPress={() => handleEditCycleField("cycle_number")}
          />
          <StaticRow label="DELOAD EVERY" value="3 CYCLES" />
          <StaticRow label="NEXT DELOAD" value={safeCycleState.is_deload ? "NOW" : `${daysUntilDeload} DAYS`} />
          <SettingsRow
            label="NEXT DAY"
            value={String(safeCycleState.next_day)}
            onPress={() => handleEditCycleField("next_day")}
          />
        </View>

        {/* ── TIMER ── */}
        <SectionHeader title="TIMER" />
        <View>
          <SettingsRow
            label="REST · COMPOUND"
            value={formatTime(safeProfile.rest_timer_compound)}
            onPress={() => handleEditRestTimer("rest_timer_compound")}
          />
          <SettingsRow
            label="REST · ACCESSORY"
            value={formatTime(safeProfile.rest_timer_accessory)}
            onPress={() => handleEditRestTimer("rest_timer_accessory")}
          />
        </View>

        {/* ── NUTRITION ── */}
        <SectionHeader title="NUTRITION" />
        <View>
          {nutritionData ? (
            <>
              <SettingsRow
                label="CALORIES"
                value={`${calculateNutrition(nutritionForm, safeProfile.units).calories} KCAL`}
                onPress={() => setShowNutritionModal(true)}
              />
              <SettingsRow
                label="GOAL"
                value={nutritionForm.goal ? goalLabel(nutritionForm.goal).toUpperCase() : "—"}
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
                      nutrition$.goal.set(v as Goal);
                      closePicker();
                    }
                  )
                }
              />
              <SettingsRow
                label="ACTIVITY"
                value={nutritionForm.activity_level ? activityLabel(nutritionForm.activity_level).toUpperCase() : "—"}
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
                      nutrition$.activity_level.set(v as ActivityLevel);
                      closePicker();
                    }
                  )
                }
              />
              <SettingsRow
                label="CLEAR NUTRITION"
                value="→"
                onPress={handleClearNutrition}
                danger
              />
            </>
          ) : (
            <SettingsRow
              label="SET UP NUTRITION"
              value="→"
              onPress={() => setShowNutritionModal(true)}
            />
          )}
        </View>

        {/* ── SYSTEM ── */}
        <SectionHeader title="SYSTEM" />
        <View>
          <StaticRow label="SYNC" value="SUPABASE · ON" />
          <SettingsRow
            label="EXPORT DATA"
            value="→"
            onPress={handleExport}
          />
          <SettingsRow
            label="EDIT WEIGHTS"
            value="→"
            onPress={() => setShowWeightsModal(true)}
          />
        </View>

        {/* ── DANGER ── */}
        <SectionHeader title="DANGER" />
        <View>
          <SettingsRow
            label="RESET PROGRAM"
            value="→"
            onPress={handleClearAllData}
            danger
          />
          <SettingsRow
            label="SIGN OUT"
            value="→"
            onPress={handleSignOut}
            danger
          />
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>JUST PULL · V2.1.0 · MMXXVI</Text>
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
            id,
            date: new Date().toISOString().split("T")[0],
            weight,
            body_fat_percent: bf,
            user_id: auth$.uid.get(),
          } as any);
          setLastSavedBodyLog({ weight, body_fat_percent: bf });
          // Sync bodyweight to nutrition so TDEE recalculates
          const currentNutrition = nutrition$.get();
          if (currentNutrition) {
            nutrition$.weight.set(weight);
            updateNutritionField("weight", weight);
          }
          setBodyLogModalVisible(false);
        }}
        onCancel={() => setBodyLogModalVisible(false)}
      />

      {/* Weights Modal */}
      <Modal
        visible={showWeightsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>WORKING WEIGHTS</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ALL_EXERCISE_KEYS.map((key) => (
                <SettingsRow
                  key={key}
                  label={keyToDisplayName(key)}
                  value={`${weights[key]?.working ?? "—"} ${safeProfile.units.toUpperCase()}`}
                  onPress={() => {
                    pendingModalActionRef.current = () => handleEditWeight(key);
                    setShowWeightsModal(false);
                  }}
                />
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalCancelBtn, { marginTop: 16 }]}
              onPress={() => setShowWeightsModal(false)}
            >
              <Text style={styles.modalCancelText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Nutrition Modal */}
      <Modal
        visible={showNutritionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNutritionModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>NUTRITION</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <SettingsRow
                label="AGE"
                value={String(nutritionForm.age)}
                onPress={() => {
                  closeNutritionThen(() => openEdit("Age (years)", String(nutritionForm.age), (v) => {
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n > 0) {
                      updateNutritionField("age", n);
                      nutrition$.age.set(n);
                    }
                    closeEdit();
                  }));
                }}
              />
              <SettingsRow
                label={`WEIGHT (${safeProfile.units.toUpperCase()})`}
                value={String(nutritionForm.weight)}
                onPress={() => {
                  closeNutritionThen(() => openEdit(`Body Weight (${safeProfile.units})`, String(nutritionForm.weight), (v) => {
                    const n = parseFloat(v);
                    if (!isNaN(n) && n > 0) {
                      updateNutritionField("weight", n);
                      nutrition$.weight.set(n);
                    }
                    closeEdit();
                  }));
                }}
              />
              <SettingsRow
                label={`HEIGHT (${safeProfile.units === "lb" ? "IN" : "CM"})`}
                value={String(nutritionForm.height)}
                onPress={() => {
                  closeNutritionThen(() => openEdit(`Height (${safeProfile.units === "lb" ? "inches" : "cm"})`, String(nutritionForm.height), (v) => {
                    const n = parseFloat(v);
                    if (!isNaN(n) && n > 0) {
                      updateNutritionField("height", n);
                      nutrition$.height.set(n);
                    }
                    closeEdit();
                  }));
                }}
              />
              <SettingsRow
                label="SEX"
                value={nutritionForm.sex === "male" ? "MALE" : "FEMALE"}
                onPress={() => {
                  closeNutritionThen(() => openPicker(
                    "Sex",
                    [
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                    ],
                    nutritionForm.sex,
                    (v) => {
                      updateNutritionField("sex", v as "male" | "female");
                      nutrition$.sex.set(v as "male" | "female");
                      closePicker();
                    }
                  ));
                }}
              />

              {/* Preview */}
              <View style={styles.nutritionPreviewContainer}>
                <Text style={styles.modalInputLabel}>DAILY TARGETS</Text>
                <View style={styles.nutritionPreviewRow}>
                  <View style={styles.nutritionPreviewCell}>
                    <Text style={[styles.nutritionPreviewNum, { color: colors.accent }]}>{nutritionPreview.calories}</Text>
                    <Text style={styles.nutritionPreviewLabel}>KCAL</Text>
                  </View>
                  <View style={styles.nutritionPreviewCell}>
                    <Text style={[styles.nutritionPreviewNum, { color: colors.green }]}>{nutritionPreview.protein}</Text>
                    <Text style={styles.nutritionPreviewLabel}>PROTEIN</Text>
                  </View>
                  <View style={styles.nutritionPreviewCell}>
                    <Text style={[styles.nutritionPreviewNum, { color: colors.text }]}>{nutritionPreview.carbs}</Text>
                    <Text style={styles.nutritionPreviewLabel}>CARBS</Text>
                  </View>
                  <View style={styles.nutritionPreviewCell}>
                    <Text style={[styles.nutritionPreviewNum, { color: colors.red }]}>{nutritionPreview.fat}</Text>
                    <Text style={styles.nutritionPreviewLabel}>FAT</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalCancelBtn, { marginTop: 16 }]}
              onPress={() => setShowNutritionModal(false)}
            >
              <Text style={styles.modalCancelText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },

  // ── Header slab ──
  headerSlab: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.bg,
  },
  headerLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerDisplay: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 44,
    color: colors.text,
    letterSpacing: -0.3,
  },
  accentDot: {
    color: colors.accent,
  },
  headerEmail: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hairline: {
    height: 1,
    backgroundColor: colors.hairline,
    marginTop: 14,
  },

  // ── Section headers ──
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 6,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  sectionHeaderText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },

  // ── Rows ──
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    minHeight: 48,
  },
  rowLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  rowValue: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  dangerText: {
    color: colors.red,
  },

  // ── Footer ──
  footer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textTertiary,
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 0,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.text,
    marginBottom: 16,
  },
  modalInputLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 0,
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.regular,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 0,
    alignItems: "center",
  },
  modalCancelBtn: {
    backgroundColor: colors.surfaceTertiary,
  },
  modalCancelText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: colors.accent,
  },
  modalSaveText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.textInverse,
  },

  // ── Picker modal ──
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  pickerOptionSelected: {},
  pickerOptionText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  pickerOptionTextSelected: {
    color: colors.accent,
    fontFamily: fonts.semiBold,
  },
  pickerCheck: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 14,
  },

  // ── Nutrition preview ──
  nutritionPreviewContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  nutritionPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  nutritionPreviewCell: {
    alignItems: "center",
  },
  nutritionPreviewNum: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
  },
  nutritionPreviewLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
