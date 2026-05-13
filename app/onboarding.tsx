import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createInitialCycleState } from "../src/hooks/useCycleState";
import { ALL_EXERCISE_KEYS, COMPOUND_KEYS } from "../src/program";
import { profile$, cycle_state$, weights$, increments$, nutrition$ } from "../src/lib/store";
import { auth$ } from "../src/lib/auth";
import { supabase } from "../src/lib/supabase";
import {
  ExerciseWeightInput,
  NutritionInput,
  Units,
  ActivityLevel,
  Goal,
} from "../src/types";
import { colors, typography, spacing, radius } from "../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Compound exercise config ------------------------------------------------
interface CompoundConfig {
  label: string;
  keys: string[];
  defaultLb: number;
  defaultKg: number;
  increment: number;
  hint?: string;
}

const COMPOUND_EXERCISES: CompoundConfig[] = [
  { label: "Deadlift", keys: ["deadlift_4"], defaultLb: 135, defaultKg: 60, increment: 10 },
  { label: "Squat", keys: ["squat_4", "squat_8"], defaultLb: 135, defaultKg: 60, increment: 10 },
  { label: "Bench Press", keys: ["bench_4", "bench_8"], defaultLb: 95, defaultKg: 42.5, increment: 5 },
  { label: "OHP", keys: ["ohp_4", "ohp_8"], defaultLb: 65, defaultKg: 30, increment: 5 },
  { label: "BB Rows", keys: ["bb_rows_4", "bb_rows_8"], defaultLb: 95, defaultKg: 42.5, increment: 5 },
  { label: "Incline Press", keys: ["incline_press_4", "incline_press_8"], defaultLb: 75, defaultKg: 35, increment: 5 },
  {
    label: "Chinups",
    keys: ["chinups_4", "chinups_8"],
    defaultLb: 0,
    defaultKg: 0,
    increment: 5,
    hint: "Added weight (0 = bodyweight)",
  },
];

const ACCESSORY_KEYS = [
  "curls_12",
  "flies_12",
  "tricep_ext_12",
  "calf_raise_12",
  "rear_delt_fly_12",
  "lat_raise_12",
];

const ACCESSORY_DEFAULTS: Record<string, number> = {
  curls_12: 25,
  flies_12: 15,
  tricep_ext_12: 20,
  calf_raise_12: 50,
  rear_delt_fly_12: 10,
  lat_raise_12: 10,
};

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: "bulk", label: "Bulk" },
  { value: "maintain", label: "Maintain" },
  { value: "cut", label: "Cut" },
];

// --- Step indicator ----------------------------------------------------------
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i === current && styles.stepDotActive,
            i < current && styles.stepDotDone,
          ]}
        />
      ))}
    </View>
  );
}

// --- Step 1: Units -----------------------------------------------------------
function StepUnits({
  units,
  onSelect,
}: {
  units: Units | null;
  onSelect: (u: Units) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Your Units</Text>
      <Text style={styles.stepSubtitle}>
        How do you prefer to track weight?
      </Text>

      <View style={styles.unitButtons}>
        <TouchableOpacity
          style={[
            styles.unitButton,
            units === "lb" && styles.unitButtonActive,
          ]}
          onPress={() => onSelect("lb")}
          activeOpacity={0.7}
        >
          <Text style={styles.unitEmoji}>lb</Text>
          <Text
            style={[
              styles.unitLabel,
              units === "lb" && styles.unitLabelActive,
            ]}
          >
            Pounds
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.unitButton,
            units === "kg" && styles.unitButtonActive,
          ]}
          onPress={() => onSelect("kg")}
          activeOpacity={0.7}
        >
          <Text style={styles.unitEmoji}>kg</Text>
          <Text
            style={[
              styles.unitLabel,
              units === "kg" && styles.unitLabelActive,
            ]}
          >
            Kilograms
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Step 2: Starting Weights ------------------------------------------------
function StepWeights({
  units,
  weights,
  onChange,
}: {
  units: Units;
  weights: Record<string, string>;
  onChange: (label: string, value: string) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Starting Weights</Text>
      <Text style={styles.stepSubtitle}>
        Enter your current working weight for each lift ({units})
      </Text>

      <ScrollView
        style={styles.weightScroll}
        contentContainerStyle={styles.weightScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {COMPOUND_EXERCISES.map((ex) => (
          <View key={ex.label} style={styles.weightRow}>
            <View style={styles.weightLabelCol}>
              <Text style={styles.weightLabel}>{ex.label}</Text>
              {ex.hint && (
                <Text style={styles.weightHint}>{ex.hint}</Text>
              )}
            </View>
            <View style={styles.weightInputWrapper}>
              <TextInput
                style={styles.weightInput}
                keyboardType="numeric"
                placeholder={
                  units === "lb"
                    ? String(ex.defaultLb)
                    : String(ex.defaultKg)
                }
                placeholderTextColor={colors.textTertiary}
                value={weights[ex.label] ?? ""}
                onChangeText={(v) => onChange(ex.label, v)}
                selectTextOnFocus
              />
              <Text style={styles.weightUnit}>{units}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// --- Step 3: Rest Timer ------------------------------------------------------
function StepTimer({
  compoundSec,
  accessorySec,
  onChangeCompound,
  onChangeAccessory,
}: {
  compoundSec: string;
  accessorySec: string;
  onChangeCompound: (v: string) => void;
  onChangeAccessory: (v: string) => void;
}) {
  const formatDisplay = (sec: string) => {
    const n = parseInt(sec, 10) || 0;
    const m = Math.floor(n / 60);
    const s = n % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Rest Timers</Text>
      <Text style={styles.stepSubtitle}>
        Set your rest duration between sets (in seconds)
      </Text>

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Compound Exercises</Text>
        <Text style={styles.timerHint}>Squat, Bench, Deadlift, etc.</Text>
        <View style={styles.timerInputRow}>
          <TextInput
            style={styles.timerInput}
            keyboardType="numeric"
            value={compoundSec}
            onChangeText={onChangeCompound}
            selectTextOnFocus
          />
          <Text style={styles.timerSec}>sec</Text>
          <Text style={styles.timerFormatted}>
            {formatDisplay(compoundSec)}
          </Text>
        </View>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Accessory Exercises</Text>
        <Text style={styles.timerHint}>Curls, Flies, Calf Raises, etc.</Text>
        <View style={styles.timerInputRow}>
          <TextInput
            style={styles.timerInput}
            keyboardType="numeric"
            value={accessorySec}
            onChangeText={onChangeAccessory}
            selectTextOnFocus
          />
          <Text style={styles.timerSec}>sec</Text>
          <Text style={styles.timerFormatted}>
            {formatDisplay(accessorySec)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// --- Step 4: Nutrition -------------------------------------------------------
function StepNutrition({
  nutrition,
  onChange,
}: {
  nutrition: Partial<NutritionInput>;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Nutrition Setup</Text>
      <Text style={styles.stepSubtitle}>
        Optional -- helps calculate calorie & macro targets
      </Text>

      <ScrollView
        style={styles.weightScroll}
        contentContainerStyle={styles.weightScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Age */}
        <View style={styles.nutritionField}>
          <Text style={styles.nutritionLabel}>Age</Text>
          <TextInput
            style={styles.nutritionInput}
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor={colors.textTertiary}
            value={nutrition.age ? String(nutrition.age) : ""}
            onChangeText={(v) => onChange("age", parseInt(v, 10) || 0)}
            selectTextOnFocus
          />
        </View>

        {/* Body weight */}
        <View style={styles.nutritionField}>
          <Text style={styles.nutritionLabel}>Body Weight</Text>
          <TextInput
            style={styles.nutritionInput}
            keyboardType="numeric"
            placeholder="170"
            placeholderTextColor={colors.textTertiary}
            value={nutrition.weight ? String(nutrition.weight) : ""}
            onChangeText={(v) => onChange("weight", parseInt(v, 10) || 0)}
            selectTextOnFocus
          />
        </View>

        {/* Height */}
        <View style={styles.nutritionField}>
          <Text style={styles.nutritionLabel}>Height (inches)</Text>
          <TextInput
            style={styles.nutritionInput}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor={colors.textTertiary}
            value={nutrition.height ? String(nutrition.height) : ""}
            onChangeText={(v) => onChange("height", parseInt(v, 10) || 0)}
            selectTextOnFocus
          />
        </View>

        {/* Sex */}
        <View style={styles.nutritionField}>
          <Text style={styles.nutritionLabel}>Sex</Text>
          <View style={styles.pillRow}>
            {(["male", "female"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.pill,
                  nutrition.sex === s && styles.pillActive,
                ]}
                onPress={() => onChange("sex", s)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    nutrition.sex === s && styles.pillTextActive,
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.nutritionField}>
          <Text style={styles.nutritionLabel}>Activity Level</Text>
          <View style={styles.pillRow}>
            {ACTIVITY_LEVELS.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[
                  styles.pill,
                  nutrition.activity_level === a.value && styles.pillActive,
                ]}
                onPress={() => onChange("activity_level", a.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    nutrition.activity_level === a.value &&
                      styles.pillTextActive,
                  ]}
                >
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View style={styles.nutritionField}>
          <Text style={styles.nutritionLabel}>Goal</Text>
          <View style={styles.pillRow}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[
                  styles.pill,
                  nutrition.goal === g.value && styles.pillActive,
                ]}
                onPress={() => onChange("goal", g.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    nutrition.goal === g.value && styles.pillTextActive,
                  ]}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Main Onboarding Screen
// =============================================================================
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const TOTAL_STEPS = 4;
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 1 state
  const [units, setUnits] = useState<Units | null>(null);

  // Step 2 state
  const [startingWeights, setStartingWeights] = useState<Record<string, string>>({});

  // Step 3 state
  const [compoundTimer, setCompoundTimer] = useState("180");
  const [accessoryTimer, setAccessoryTimer] = useState("90");

  // Step 4 state
  const [nutrition, setNutrition] = useState<Partial<NutritionInput>>({});

  // --- Navigation helpers ----------------------------------------------------
  const animateTransition = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return units !== null;
      case 1:
        return true; // weights have defaults
      case 2:
        return true; // timers have defaults
      case 3:
        return true; // nutrition is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    } else {
      handleComplete(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition(step - 1);
    }
  };

  const handleSkipNutrition = () => {
    handleComplete(true);
  };

  // --- Completion ------------------------------------------------------------
  const handleComplete = async (skipNutrition: boolean) => {
    const selectedUnits = units!;

    // 1. Update profile
    const currentProfile = profile$.get();
    if (currentProfile) {
      profile$.set({
        ...currentProfile,
        units: selectedUnits,
        rest_timer_compound: parseInt(compoundTimer, 10) || 180,
        rest_timer_accessory: parseInt(accessoryTimer, 10) || 90,
      });
    }

    // 2. Create cycle state
    cycle_state$.set({ id: auth$.uid.get()!, ...createInitialCycleState() } as any);

    // 3. Exercise weights (compound from user input)
    for (const ex of COMPOUND_EXERCISES) {
      const raw = startingWeights[ex.label];
      const defaultVal = selectedUnits === "lb" ? ex.defaultLb : ex.defaultKg;
      const weight = raw && raw.trim() !== "" ? parseFloat(raw) : defaultVal;

      for (const key of ex.keys) {
        weights$[key].set({ exercise_key: key, working: weight, pr: null, pr_status: null } as any);
      }
    }

    // Accessory exercises initialize with sensible defaults
    for (const key of ACCESSORY_KEYS) {
      const defaultLb = ACCESSORY_DEFAULTS[key] ?? 0;
      const defaultWeight = selectedUnits === "lb" ? defaultLb : Math.round(defaultLb / 2.2 / 2.5) * 2.5;
      weights$[key].set({ exercise_key: key, working: defaultWeight, pr: null, pr_status: null } as any);
    }

    // 4. Increments (compound only) — insert directly via Supabase
    const incrementRows = COMPOUND_EXERCISES.flatMap((ex) =>
      ex.keys.map((key) => ({ exercise_key: key, increment: ex.increment }))
    );
    await supabase.from("increments").insert(incrementRows);

    // 5. Optional nutrition
    const allNutritionFieldsFilled =
      nutrition.age &&
      nutrition.weight &&
      nutrition.height &&
      nutrition.sex &&
      nutrition.activity_level &&
      nutrition.goal;

    if (!skipNutrition && allNutritionFieldsFilled) {
      nutrition$.set(nutrition as NutritionInput as any);
    }

    // 6. Mark complete LAST -- _layout.tsx handles routing based on this
    profile$.onboarding_complete.set(true);

    // Navigate explicitly so we don't rely solely on reactive redirect
    router.replace("/(tabs)");
  };

  // --- Weight change handler -------------------------------------------------
  const handleWeightChange = (label: string, value: string) => {
    // Only allow digits and decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    setStartingWeights((prev) => ({ ...prev, [label]: cleaned }));
  };

  // --- Nutrition change handler ----------------------------------------------
  const handleNutritionChange = (field: string, value: any) => {
    setNutrition((prev) => ({ ...prev, [field]: value }));
  };

  // --- Render current step ---------------------------------------------------
  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepUnits units={units} onSelect={setUnits} />;
      case 1:
        return (
          <StepWeights
            units={units!}
            weights={startingWeights}
            onChange={handleWeightChange}
          />
        );
      case 2:
        return (
          <StepTimer
            compoundSec={compoundTimer}
            accessorySec={accessoryTimer}
            onChangeCompound={setCompoundTimer}
            onChangeAccessory={setAccessoryTimer}
          />
        );
      case 3:
        return (
          <StepNutrition
            nutrition={nutrition}
            onChange={handleNutritionChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 16, 60) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>JUST PULL</Text>
          <StepIndicator current={step} total={TOTAL_STEPS} />
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 0 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          <View style={styles.footerRight}>
            {step === 3 && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipNutrition}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton,
                !canAdvance() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!canAdvance()}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.nextButtonText,
                  !canAdvance() && styles.nextButtonTextDisabled,
                ]}
              >
                {step === TOTAL_STEPS - 1 ? "Finish" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: spacing.xl,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  brand: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 18,
    color: colors.accent,
    letterSpacing: 6,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
  stepDotDone: {
    backgroundColor: colors.accentDim,
  },

  // Content
  content: {
    flex: 1,
  },

  // Step container
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    ...typography.title,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    color: colors.textSecondary,
    ...typography.body,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  // Step 1: Units
  unitButtons: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  unitButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  unitButtonActive: {
    backgroundColor: colors.accentGlow,
  },
  unitEmoji: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 32,
    color: colors.accent,
    width: 60,
    textAlign: "center",
  },
  unitLabel: {
    ...typography.title,
    color: colors.textSecondary,
  },
  unitLabelActive: {
    color: colors.text,
  },

  // Step 2: Weights
  weightScroll: {
    flex: 1,
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  weightScrollContent: {
    paddingBottom: spacing.xl,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  weightLabelCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  weightLabel: {
    color: colors.text,
    ...typography.bodyBold,
  },
  weightHint: {
    color: colors.textTertiary,
    ...typography.micro,
    marginTop: 2,
  },
  weightInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weightInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 22,
    textAlign: "center",
    width: 80,
    height: 48,
    paddingHorizontal: spacing.sm,
  },
  weightUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 24,
  },

  // Step 3: Timer
  timerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  timerLabel: {
    color: colors.text,
    ...typography.subtitle,
    marginBottom: 2,
  },
  timerHint: {
    color: colors.textTertiary,
    ...typography.micro,
    marginBottom: spacing.md,
  },
  timerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timerInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 24,
    textAlign: "center",
    width: 80,
    height: 48,
  },
  timerSec: {
    color: colors.textSecondary,
    ...typography.bodyBold,
  },
  timerFormatted: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 22,
    color: colors.accent,
    marginLeft: "auto",
  },

  // Step 4: Nutrition
  nutritionField: {
    marginBottom: spacing.lg,
  },
  nutritionLabel: {
    color: colors.text,
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  nutritionInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 22,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 48,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: colors.accentGlow,
  },
  pillText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.accent,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backButton: {
    minWidth: 64,
    height: 48,
    justifyContent: "center",
  },
  backButtonText: {
    color: colors.textSecondary,
    ...typography.bodyBold,
  },
  skipButton: {
    height: 48,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  skipButtonText: {
    color: colors.textSecondary,
    ...typography.bodyBold,
  },
  nextButton: {
    backgroundColor: colors.accent,
    height: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  nextButtonDisabled: {
    backgroundColor: colors.surfaceTertiary,
  },
  nextButtonText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
  },
  nextButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
