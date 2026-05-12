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
import { useAppContext } from "../src/context";
import { setOnboardingComplete } from "../src/storage";
import { createInitialCycleState } from "../src/hooks/useCycleState";
import { ALL_EXERCISE_KEYS, COMPOUND_KEYS } from "../src/program";
import {
  Settings,
  ExerciseWeight,
  NutritionSettings,
  Units,
  ActivityLevel,
  Goal,
} from "../src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  bg: "#0A0A0A",
  card: "#161616",
  cardBorder: "#222",
  accent: "#6C63FF",
  accentDim: "#4A43CC",
  text: "#FFFFFF",
  textDim: "#888",
  textMuted: "#555",
  inputBg: "#1A1A1A",
  inputBorder: "#333",
  inputFocus: "#6C63FF",
  success: "#34D399",
  error: "#EF4444",
};

// ─── Compound exercise config ────────────────────────────────────────
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

// ─── Step indicator ──────────────────────────────────────────────────
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

// ─── Step 1: Units ───────────────────────────────────────────────────
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

// ─── Step 2: Starting Weights ────────────────────────────────────────
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
                placeholderTextColor={COLORS.textMuted}
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

// ─── Step 3: Rest Timer ──────────────────────────────────────────────
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

// ─── Step 4: Nutrition ───────────────────────────────────────────────
function StepNutrition({
  nutrition,
  onChange,
}: {
  nutrition: Partial<NutritionSettings>;
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
            placeholderTextColor={COLORS.textMuted}
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
            placeholderTextColor={COLORS.textMuted}
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
            placeholderTextColor={COLORS.textMuted}
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
                  nutrition.activityLevel === a.value && styles.pillActive,
                ]}
                onPress={() => onChange("activityLevel", a.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    nutrition.activityLevel === a.value &&
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

// ═════════════════════════════════════════════════════════════════════
// Main Onboarding Screen
// ═════════════════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSettings, setCycleState, setWeights } = useAppContext();

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
  const [nutrition, setNutrition] = useState<Partial<NutritionSettings>>({});

  // ─── Navigation helpers ────────────────────────────────────────────
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

  // ─── Completion ────────────────────────────────────────────────────
  const handleComplete = async (skipNutrition: boolean) => {
    const selectedUnits = units!;

    // Build increments
    const increments: Record<string, number> = {};
    for (const ex of COMPOUND_EXERCISES) {
      for (const key of ex.keys) {
        increments[key] = ex.increment;
      }
    }

    // Build nutrition settings
    let nutritionSettings: NutritionSettings | null = null;
    if (
      !skipNutrition &&
      nutrition.age &&
      nutrition.weight &&
      nutrition.height &&
      nutrition.sex &&
      nutrition.activityLevel &&
      nutrition.goal
    ) {
      nutritionSettings = nutrition as NutritionSettings;
    }

    // Build settings
    const settings: Settings = {
      units: selectedUnits,
      restTimerCompound: parseInt(compoundTimer, 10) || 180,
      restTimerAccessory: parseInt(accessoryTimer, 10) || 90,
      increments,
      nutrition: nutritionSettings,
    };

    // Build weights map
    const weightsMap: Record<string, ExerciseWeight> = {};

    // Compound exercises from user input
    for (const ex of COMPOUND_EXERCISES) {
      const raw = startingWeights[ex.label];
      const defaultVal = selectedUnits === "lb" ? ex.defaultLb : ex.defaultKg;
      const weight = raw && raw.trim() !== "" ? parseFloat(raw) : defaultVal;

      for (const key of ex.keys) {
        weightsMap[key] = {
          working: weight,
          pr: null,
          prStatus: null,
        };
      }
    }

    // Accessory exercises initialize to 0
    for (const key of ACCESSORY_KEYS) {
      weightsMap[key] = {
        working: 0,
        pr: null,
        prStatus: null,
      };
    }

    // Save everything
    await setSettings(settings);
    await setWeights(weightsMap);
    await setCycleState(createInitialCycleState());
    await setOnboardingComplete();

    router.replace("/(tabs)");
  };

  // ─── Weight change handler ─────────────────────────────────────────
  const handleWeightChange = (label: string, value: string) => {
    // Only allow digits and decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    setStartingWeights((prev) => ({ ...prev, [label]: cleaned }));
  };

  // ─── Nutrition change handler ──────────────────────────────────────
  const handleNutritionChange = (field: string, value: any) => {
    setNutrition((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Render current step ──────────────────────────────────────────
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

// ═════════════════════════════════════════════════════════════════════
// Styles
// ═════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: 4,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    gap: 8,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
  },
  stepDotActive: {
    backgroundColor: COLORS.accent,
  },
  stepDotDone: {
    backgroundColor: COLORS.accentDim,
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
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textDim,
    marginBottom: 28,
    lineHeight: 22,
  },

  // Step 1: Units
  unitButtons: {
    gap: 16,
    marginTop: 16,
  },
  unitButton: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  unitButtonActive: {
    borderColor: COLORS.accent,
    backgroundColor: "#1A1730",
  },
  unitEmoji: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.accent,
    width: 60,
    textAlign: "center",
  },
  unitLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textDim,
  },
  unitLabelActive: {
    color: COLORS.text,
  },

  // Step 2: Weights
  weightScroll: {
    flex: 1,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  weightScrollContent: {
    paddingBottom: 24,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  weightLabelCol: {
    flex: 1,
    marginRight: 12,
  },
  weightLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  weightHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  weightInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weightInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    width: 80,
    height: 48,
    paddingHorizontal: 8,
  },
  weightUnit: {
    fontSize: 14,
    color: COLORS.textDim,
    fontWeight: "600",
    width: 24,
  },

  // Step 3: Timer
  timerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  timerLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  timerHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  timerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timerInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    width: 80,
    height: 52,
  },
  timerSec: {
    fontSize: 15,
    color: COLORS.textDim,
    fontWeight: "600",
  },
  timerFormatted: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: "700",
    marginLeft: "auto",
  },

  // Step 4: Nutrition
  nutritionField: {
    marginBottom: 20,
  },
  nutritionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  nutritionInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
    height: 52,
    paddingHorizontal: 16,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 48,
    alignItems: "center",
  },
  pillActive: {
    borderColor: COLORS.accent,
    backgroundColor: "#1A1730",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDim,
  },
  pillTextActive: {
    color: COLORS.text,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    minWidth: 64,
    height: 48,
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDim,
  },
  skipButton: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDim,
  },
  nextButton: {
    backgroundColor: COLORS.accent,
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  nextButtonTextDisabled: {
    color: COLORS.textMuted,
  },
});
