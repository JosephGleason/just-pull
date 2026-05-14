import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
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
import { colors, fonts } from "../src/theme";

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

// --- Step config (labels + prompts) ------------------------------------------
const STEP_CONFIG = [
  { label: "UNITS", prompt: "How do you\ntrack?." },
  { label: "STARTING WEIGHTS", prompt: "What do\nyou lift?." },
  { label: "REST TIMER", prompt: "How long\ndo you rest?." },
  { label: "NUTRITION", prompt: "Tell us\nabout you?." },
];

// --- Step header slab --------------------------------------------------------
function StepHeader({
  current,
  total,
  onSkip,
}: {
  current: number;
  total: number;
  onSkip?: () => void;
}) {
  const stepNum = String(current + 1).padStart(2, "0");
  const totalNum = String(total).padStart(2, "0");

  return (
    <View style={s.headerSlab}>
      <View style={s.headerTopRow}>
        <Text style={s.headerStepLabel}>
          STEP {stepNum} / {totalNum}
        </Text>
        {onSkip ? (
          <TouchableOpacity onPress={onSkip} activeOpacity={0.7} hitSlop={12}>
            <Text style={s.headerSkip}>{"SKIP →"}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>
      <View style={s.headerBarRow}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              s.headerBar,
              { backgroundColor: i <= current ? colors.accent : colors.hairlineStrong },
            ]}
          />
        ))}
      </View>
      <View style={s.hairlineDivider} />
    </View>
  );
}

// --- Prompt slab -------------------------------------------------------------
function PromptSlab({ label, prompt }: { label: string; prompt: string }) {
  // Split the prompt to render the trailing period in accent
  const endsWithDot = prompt.endsWith("?.");
  const mainText = endsWithDot ? prompt.slice(0, -1) : prompt;
  const trailingChar = endsWithDot ? "." : "";

  return (
    <View style={s.promptSlab}>
      <Text style={s.promptLabel}>{label}</Text>
      <Text style={s.promptDisplay}>
        {mainText}
        {trailingChar ? <Text style={{ color: colors.accent }}>{trailingChar}</Text> : null}
      </Text>
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
    <View style={s.inputSlab}>
      <TouchableOpacity
        style={[
          s.optionCard,
          units === "lb" && s.optionCardActive,
        ]}
        onPress={() => onSelect("lb")}
        activeOpacity={0.7}
      >
        <Text style={[s.optionCardUnit, units === "lb" && s.optionCardTextActive]}>lb</Text>
        <Text style={[s.optionCardLabel, units === "lb" && s.optionCardTextActive]}>Pounds</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          s.optionCard,
          units === "kg" && s.optionCardActive,
        ]}
        onPress={() => onSelect("kg")}
        activeOpacity={0.7}
      >
        <Text style={[s.optionCardUnit, units === "kg" && s.optionCardTextActive]}>kg</Text>
        <Text style={[s.optionCardLabel, units === "kg" && s.optionCardTextActive]}>Kilograms</Text>
      </TouchableOpacity>
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
    <ScrollView
      style={s.scrollFill}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {COMPOUND_EXERCISES.map((ex) => (
        <View key={ex.label} style={s.weightRow}>
          <View style={s.weightLabelCol}>
            <Text style={s.weightLabel}>{ex.label}</Text>
            {ex.hint && <Text style={s.weightHint}>{ex.hint}</Text>}
          </View>
          <View style={s.weightInputWrapper}>
            <TextInput
              style={s.weightInput}
              keyboardType="numeric"
              placeholder={
                units === "lb" ? String(ex.defaultLb) : String(ex.defaultKg)
              }
              placeholderTextColor={colors.textTertiary}
              value={weights[ex.label] ?? ""}
              onChangeText={(v) => onChange(ex.label, v)}
              selectTextOnFocus
            />
            <Text style={s.weightUnit}>{units}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
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
    const ss = n % 60;
    return `${m}:${ss.toString().padStart(2, "0")}`;
  };

  return (
    <View style={s.inputSlab}>
      <View style={s.timerCard}>
        <Text style={s.timerLabel}>Compound Exercises</Text>
        <Text style={s.timerHint}>SQUAT, BENCH, DEADLIFT, ETcolors.</Text>
        <View style={s.timerInputRow}>
          <TextInput
            style={s.timerInput}
            keyboardType="numeric"
            value={compoundSec}
            onChangeText={onChangeCompound}
            selectTextOnFocus
          />
          <Text style={s.timerSec}>sec</Text>
          <Text style={s.timerFormatted}>{formatDisplay(compoundSec)}</Text>
        </View>
      </View>

      <View style={s.timerCard}>
        <Text style={s.timerLabel}>Accessory Exercises</Text>
        <Text style={s.timerHint}>CURLS, FLIES, CALF RAISES, ETcolors.</Text>
        <View style={s.timerInputRow}>
          <TextInput
            style={s.timerInput}
            keyboardType="numeric"
            value={accessorySec}
            onChangeText={onChangeAccessory}
            selectTextOnFocus
          />
          <Text style={s.timerSec}>sec</Text>
          <Text style={s.timerFormatted}>{formatDisplay(accessorySec)}</Text>
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
    <ScrollView
      style={s.scrollFill}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Age */}
      <View style={s.nutritionField}>
        <Text style={s.nutritionLabel}>AGE</Text>
        <TextInput
          style={s.nutritionInput}
          keyboardType="numeric"
          placeholder="25"
          placeholderTextColor={colors.textTertiary}
          value={nutrition.age ? String(nutrition.age) : ""}
          onChangeText={(v) => onChange("age", parseInt(v, 10) || 0)}
          selectTextOnFocus
        />
      </View>

      {/* Body weight */}
      <View style={s.nutritionField}>
        <Text style={s.nutritionLabel}>BODY WEIGHT</Text>
        <TextInput
          style={s.nutritionInput}
          keyboardType="numeric"
          placeholder="170"
          placeholderTextColor={colors.textTertiary}
          value={nutrition.weight ? String(nutrition.weight) : ""}
          onChangeText={(v) => onChange("weight", parseInt(v, 10) || 0)}
          selectTextOnFocus
        />
      </View>

      {/* Height */}
      <View style={s.nutritionField}>
        <Text style={s.nutritionLabel}>HEIGHT (INCHES)</Text>
        <TextInput
          style={s.nutritionInput}
          keyboardType="numeric"
          placeholder="70"
          placeholderTextColor={colors.textTertiary}
          value={nutrition.height ? String(nutrition.height) : ""}
          onChangeText={(v) => onChange("height", parseInt(v, 10) || 0)}
          selectTextOnFocus
        />
      </View>

      {/* Sex */}
      <View style={s.nutritionField}>
        <Text style={s.nutritionLabel}>SEX</Text>
        <View style={s.chipRow}>
          {(["male", "female"] as const).map((val) => (
            <TouchableOpacity
              key={val}
              style={[s.chip, nutrition.sex === val && s.chipActive]}
              onPress={() => onChange("sex", val)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, nutrition.sex === val && s.chipTextActive]}>
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Activity Level */}
      <View style={s.nutritionField}>
        <Text style={s.nutritionLabel}>ACTIVITY LEVEL</Text>
        <View style={s.chipRow}>
          {ACTIVITY_LEVELS.map((a) => (
            <TouchableOpacity
              key={a.value}
              style={[s.chip, nutrition.activity_level === a.value && s.chipActive]}
              onPress={() => onChange("activity_level", a.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  s.chipText,
                  nutrition.activity_level === a.value && s.chipTextActive,
                ]}
              >
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Goal */}
      <View style={s.nutritionField}>
        <Text style={s.nutritionLabel}>GOAL</Text>
        <View style={s.chipRow}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[s.chip, nutrition.goal === g.value && s.chipActive]}
              onPress={() => onChange("goal", g.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[s.chipText, nutrition.goal === g.value && s.chipTextActive]}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
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
        weights$[key].set({ exercise_key: key, working: weight, pr: null, pr_status: null, fail_count: 0 } as any);
      }
    }

    // Accessory exercises initialize with sensible defaults
    for (const key of ACCESSORY_KEYS) {
      const defaultLb = ACCESSORY_DEFAULTS[key] ?? 0;
      const defaultWeight = selectedUnits === "lb" ? defaultLb : Math.round(defaultLb / 2.2 / 2.5) * 2.5;
      weights$[key].set({ exercise_key: key, working: defaultWeight, pr: null, pr_status: null, fail_count: 0 } as any);
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

  // --- Render current step content -------------------------------------------
  const renderStepContent = () => {
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

  const isLastStep = step === TOTAL_STEPS - 1;
  const cfg = STEP_CONFIG[step];

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.container, { paddingTop: insets.top }]}>
        {/* Step header slab */}
        <StepHeader
          current={step}
          total={TOTAL_STEPS}
          onSkip={step === 3 ? handleSkipNutrition : undefined}
        />

        {/* Prompt slab */}
        <PromptSlab label={cfg.label} prompt={cfg.prompt} />

        {/* Input slab — animated */}
        <Animated.View style={[s.contentArea, { opacity: fadeAnim }]}>
          {renderStepContent()}
        </Animated.View>

        {/* Spacer — only for non-scrollable steps so CTA stays at bottom */}
        {step !== 1 && step !== 3 && <View style={s.spacer} />}

        {/* Footer slab */}
        <View style={[s.footerSlab, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {step > 0 ? (
            <TouchableOpacity
              style={s.backBtn}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={s.backBtnText}>{"◂ BACK"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}

          <TouchableOpacity
            style={[s.nextBtn, !canAdvance() && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canAdvance()}
            activeOpacity={0.7}
          >
            <Text style={[s.nextBtnText, !canAdvance() && s.nextBtnTextDisabled]}>
              {isLastStep ? "OPEN THE PROGRAM ▸" : "NEXT ▸"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// =============================================================================
// Styles
// =============================================================================
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },

  // --- Step header slab ------------------------------------------------------
  headerSlab: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerStepLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.06 * 10,
    textTransform: "uppercase",
  },
  headerSkip: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.06 * 10,
    textTransform: "uppercase",
  },
  headerBarRow: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 12,
  },
  headerBar: {
    flex: 1,
    height: 3,
    borderRadius: 0,
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: colors.hairline,
  },

  // --- Prompt slab -----------------------------------------------------------
  promptSlab: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  promptLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.06 * 10,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  promptDisplay: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.text,
    maxWidth: 280,
    lineHeight: 54,
    textTransform: "uppercase",
  },

  // --- Content area ----------------------------------------------------------
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // --- Input slab (used by units, timer) ------------------------------------
  inputSlab: {
    gap: 8,
  },

  // --- Option cards (Step 1: Units) ------------------------------------------
  optionCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionCardActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionCardUnit: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
    width: 56,
    textTransform: "uppercase",
  },
  optionCardLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.text,
  },
  optionCardTextActive: {
    color: "#FFFFFF",
  },

  // --- Scrollable containers -------------------------------------------------
  scrollFill: {
    flex: 1,
    marginHorizontal: -16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // --- Weight rows (Step 2) --------------------------------------------------
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  weightLabelCol: {
    flex: 1,
    marginRight: 12,
  },
  weightLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text,
  },
  weightHint: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: 2,
    letterSpacing: 0.02 * 9,
  },
  weightInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weightInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 0,
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textAlign: "center",
    textAlignVertical: "center",
    width: 80,
    height: 56,
    paddingVertical: 10,
    includeFontPadding: false,
  },
  weightUnit: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.06 * 10,
    textTransform: "uppercase",
    width: 24,
  },

  // --- Timer cards (Step 3) --------------------------------------------------
  timerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 0,
    padding: 20,
  },
  timerLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  timerHint: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.06 * 9,
    marginBottom: 16,
  },
  timerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 0,
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    textAlign: "center",
    textAlignVertical: "center",
    width: 80,
    height: 56,
    paddingVertical: 10,
    includeFontPadding: false,
  },
  timerSec: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.06 * 10,
  },
  timerFormatted: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 30,
    color: colors.accent,
    marginLeft: "auto",
    includeFontPadding: true,
  },

  // --- Nutrition fields (Step 4) ---------------------------------------------
  nutritionField: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 14,
  },
  nutritionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.06 * 10,
    marginBottom: 8,
  },
  nutritionInput: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    borderRadius: 0,
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    height: 56,
    paddingHorizontal: 0,
    paddingVertical: 10,
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  // --- Chips / pills ---------------------------------------------------------
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 28,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.text,
    letterSpacing: 0.06 * 11,
    textTransform: "uppercase",
  },
  chipTextActive: {
    color: colors.textInverse,
  },

  // --- Spacer ----------------------------------------------------------------
  spacer: {
    flex: 1,
    minHeight: 10,
  },

  // --- Footer slab -----------------------------------------------------------
  footerSlab: {
    flexDirection: "row",
  },
  backBtn: {
    flex: 1,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  nextBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 0,
  },
  nextBtnDisabled: {
    backgroundColor: colors.surfaceTertiary,
  },
  nextBtnText: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  nextBtnTextDisabled: {
    color: colors.textTertiary,
  },
});
