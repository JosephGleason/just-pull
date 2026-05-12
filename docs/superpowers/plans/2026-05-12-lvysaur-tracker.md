# Lvysaur Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal React Native + Expo app for tracking Lvysaur's 5-day Intermediate Aesthetic Routine with guided logging, auto-progression, rest timers, progress charts, and a caloric calculator.

**Architecture:** Expo SDK 55 with Expo Router file-based routing. Four bottom tabs (Today, Progress, History, Settings) with Active Workout as a fullscreen modal. All data in AsyncStorage — no backend. Program definition hardcoded as a TypeScript module. React Context for in-memory state during sessions.

**Tech Stack:** Expo SDK 55, Expo Router, TypeScript, AsyncStorage, victory-native (charts), expo-haptics, expo-notifications, react-native-uuid

---

## File Structure

```
app/
  _layout.tsx                    # Root Stack: (tabs) + workout modal + onboarding
  onboarding.tsx                 # First-launch setup wizard
  workout.tsx                    # Active Workout fullscreen modal
  (tabs)/
    _layout.tsx                  # Bottom tab bar: Today, Progress, History, Settings
    index.tsx                    # Today / Home screen
    progress.tsx                 # Progress charts screen
    history.tsx                  # History calendar screen
    settings.tsx                 # Settings screen

src/
  program.ts                     # Hardcoded program definition (days, exercises, set counts)
  types.ts                       # All TypeScript types/interfaces
  storage.ts                     # AsyncStorage CRUD helpers (get/set/remove typed wrappers)
  context.tsx                    # React Context provider for app state
  hooks/
    useWorkout.ts                # Active workout session logic (start, log set, complete)
    useTimer.ts                  # Rest timer countdown logic
    useCycleState.ts             # Cycle/week/day state machine
    useNutrition.ts              # Mifflin-St Jeor calculator
  components/
    ExerciseCard.tsx             # Exercise row on Home screen (name, sets×reps, weight)
    SetLogger.tsx                # Single set logging UI (weight, reps, complete button)
    RestTimer.tsx                # Countdown bar at bottom of workout screen
    NutritionCard.tsx            # Macro summary card for Home screen
    ProgressChart.tsx            # Per-exercise weight chart
    CalendarGrid.tsx             # Month calendar with workout dots
    WorkoutSummary.tsx           # Post-workout summary modal
```

---

### Task 1: Project Scaffold + Git Init

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`

- [ ] **Step 1: Create Expo project**

Run:
```bash
npx create-expo-app@latest just-pull-app --template default@sdk-55
```

Then move contents into the working directory:
```bash
mv just-pull-app/* just-pull-app/.* . 2>/dev/null; rmdir just-pull-app
```

- [ ] **Step 2: Install dependencies**

```bash
npx expo install @react-native-async-storage/async-storage expo-haptics expo-notifications victory-native react-native-svg react-native-gesture-handler react-native-reanimated
```

```bash
npm install uuid
npm install -D @types/uuid
```

- [ ] **Step 3: Initialize git**

```bash
git init
echo "node_modules/\n.expo/\ndist/\n.superpowers/" > .gitignore
git add -A
git commit -m "chore: scaffold Expo project with dependencies"
```

- [ ] **Step 4: Verify the app starts**

```bash
npx expo start
```

Expected: Metro bundler starts, no errors. Press `w` to open web preview or scan QR with Expo Go.

- [ ] **Step 5: Clean up default template files**

Delete any default template screens/components that shipped with `create-expo-app` (e.g., `app/(tabs)/explore.tsx`, `components/` default files). Keep only `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`.

```bash
git add -A
git commit -m "chore: clean up default template files"
```

---

### Task 2: Types + Program Definition

**Files:**
- Create: `src/types.ts`, `src/program.ts`

- [ ] **Step 1: Write types**

Create `src/types.ts`:

```typescript
export type ExerciseType = "red" | "blue" | "black";
export type Units = "lb" | "kg";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "bulk" | "cut" | "maintain";
export type PrStatus = "pending" | "succeeded" | "failed";
export type TrainingDay = 1 | 2 | 3 | 5 | 6;
export type WeekNumber = 1 | 2 | 3;

export interface ProgramExercise {
  name: string;
  key: string;          // canonical key e.g. "bench_4"
  reps: number;
  type: ExerciseType;
  sets: [number, number, number]; // [W1, W2, W3] set counts
}

export interface ProgramDay {
  day: TrainingDay;
  exercises: ProgramExercise[];
}

export interface Settings {
  restTimerCompound: number;
  restTimerAccessory: number;
  units: Units;
  increments: Record<string, number>;
  nutrition: NutritionSettings | null;
}

export interface NutritionSettings {
  age: number;
  weight: number;
  height: number;
  sex: "male" | "female";
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface CycleState {
  cycleNumber: number;
  weekNumber: WeekNumber;
  nextDay: TrainingDay;
  isDeload: boolean;
}

export interface ExerciseWeight {
  working: number;
  pr: number | null;
  prStatus: PrStatus | null;
}

export interface SetLog {
  weight: number;
  reps: number;
  isAmrap: boolean;
  isPr: boolean;
}

export interface ExerciseLog {
  name: string;
  key: string;
  reps: number;
  type: ExerciseType;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  day: TrainingDay;
  week: WeekNumber;
  cycle: number;
  exercises: ExerciseLog[];
  completedAt: string | null;
}

export interface CurrentSession {
  startedAt: string;
  day: TrainingDay;
  week: WeekNumber;
  cycle: number;
  exercises: ExerciseLog[];
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
```

- [ ] **Step 2: Write program definition**

Create `src/program.ts`:

```typescript
import { ProgramDay, ProgramExercise, TrainingDay, WeekNumber } from "./types";

const e = (
  name: string,
  key: string,
  reps: number,
  type: "red" | "blue" | "black",
  sets: [number, number, number]
): ProgramExercise => ({ name, key, reps, type, sets });

export const PROGRAM: ProgramDay[] = [
  {
    day: 1,
    exercises: [
      e("Deadlift", "deadlift_4", 4, "blue", [2, 1, 0]),
      e("Chinups", "chinups_8", 8, "red", [3, 2, 1]),
      e("BB Rows", "bb_rows_4", 4, "red", [3, 2, 1]),
      e("Curls", "curls_12", 12, "black", [3, 2, 1]),
    ],
  },
  {
    day: 2,
    exercises: [
      e("Bench", "bench_4", 4, "red", [3, 2, 1]),
      e("Incline Press", "incline_press_8", 8, "red", [3, 2, 1]),
      e("Flies", "flies_12", 12, "black", [3, 2, 1]),
      e("Tricep Ext", "tricep_ext_12", 12, "black", [3, 2, 1]),
    ],
  },
  {
    day: 3,
    exercises: [
      e("Squat", "squat_4", 4, "blue", [2, 1, 0]),
      e("OHP", "ohp_8", 8, "red", [3, 2, 1]),
      e("Calf Raise", "calf_raise_12", 12, "black", [3, 2, 1]),
      e("Rear Delt Fly", "rear_delt_fly_12", 12, "black", [3, 2, 1]),
      e("Lat Raise", "lat_raise_12", 12, "black", [3, 2, 1]),
    ],
  },
  {
    day: 5,
    exercises: [
      e("Chinups", "chinups_4", 4, "red", [3, 2, 1]),
      e("Bench", "bench_8", 8, "red", [3, 2, 1]),
      e("BB Rows", "bb_rows_8", 8, "red", [3, 2, 1]),
      e("Incline Press", "incline_press_4", 4, "red", [3, 2, 1]),
    ],
  },
  {
    day: 6,
    exercises: [
      e("Squat", "squat_8", 8, "blue", [2, 1, 0]),
      e("OHP", "ohp_4", 4, "red", [3, 2, 1]),
      e("Calf Raise", "calf_raise_12", 12, "black", [3, 2, 1]),
      e("Curls", "curls_12", 12, "black", [3, 2, 1]),
    ],
  },
];

export const DAY_SEQUENCE: TrainingDay[] = [1, 2, 3, 5, 6];

export const ALL_EXERCISE_KEYS = [
  "deadlift_4",
  "chinups_8",
  "chinups_4",
  "bb_rows_4",
  "bb_rows_8",
  "curls_12",
  "bench_4",
  "bench_8",
  "incline_press_4",
  "incline_press_8",
  "flies_12",
  "tricep_ext_12",
  "squat_4",
  "squat_8",
  "ohp_4",
  "ohp_8",
  "calf_raise_12",
  "rear_delt_fly_12",
  "lat_raise_12",
] as const;

export const COMPOUND_KEYS = ALL_EXERCISE_KEYS.filter(
  (k) => !k.endsWith("_12")
);

export function getProgramDay(day: TrainingDay): ProgramDay {
  return PROGRAM.find((d) => d.day === day)!;
}

export function getSetsForWeek(
  exercise: ProgramExercise,
  week: WeekNumber,
  isDeload: boolean
): number {
  const base = exercise.sets[week - 1];
  const adjusted = isDeload ? Math.max(0, base - 2) : base;
  return Math.max(0, adjusted);
}
```

- [ ] **Step 3: Write tests for program definition**

Create `src/__tests__/program.test.ts`:

```typescript
import { getProgramDay, getSetsForWeek, PROGRAM, ALL_EXERCISE_KEYS, COMPOUND_KEYS } from "../program";

describe("program definition", () => {
  test("has exactly 5 training days", () => {
    expect(PROGRAM).toHaveLength(5);
    expect(PROGRAM.map((d) => d.day)).toEqual([1, 2, 3, 5, 6]);
  });

  test("getProgramDay returns correct day", () => {
    const day1 = getProgramDay(1);
    expect(day1.exercises[0].name).toBe("Deadlift");
    expect(day1.exercises[0].key).toBe("deadlift_4");
  });

  test("blue exercises taper 2/1/0", () => {
    const day1 = getProgramDay(1);
    const deadlift = day1.exercises[0];
    expect(deadlift.type).toBe("blue");
    expect(getSetsForWeek(deadlift, 1, false)).toBe(2);
    expect(getSetsForWeek(deadlift, 2, false)).toBe(1);
    expect(getSetsForWeek(deadlift, 3, false)).toBe(0);
  });

  test("red/black exercises taper 3/2/1", () => {
    const day1 = getProgramDay(1);
    const chinups = day1.exercises[1];
    expect(chinups.type).toBe("red");
    expect(getSetsForWeek(chinups, 1, false)).toBe(3);
    expect(getSetsForWeek(chinups, 2, false)).toBe(2);
    expect(getSetsForWeek(chinups, 3, false)).toBe(1);
  });

  test("deload reduces sets by 2, clamped to 0", () => {
    const day1 = getProgramDay(1);
    const deadlift = day1.exercises[0]; // blue: 2/1/0
    const chinups = day1.exercises[1];  // red: 3/2/1
    expect(getSetsForWeek(deadlift, 1, true)).toBe(0);
    expect(getSetsForWeek(chinups, 1, true)).toBe(1);
    expect(getSetsForWeek(chinups, 2, true)).toBe(0);
    expect(getSetsForWeek(chinups, 3, true)).toBe(0);
  });

  test("all canonical keys are unique", () => {
    const set = new Set(ALL_EXERCISE_KEYS);
    expect(set.size).toBe(ALL_EXERCISE_KEYS.length);
  });

  test("compound keys exclude 12-rep exercises", () => {
    expect(COMPOUND_KEYS.every((k) => !k.endsWith("_12"))).toBe(true);
  });

  test("every exercise in program has a key in ALL_EXERCISE_KEYS", () => {
    const allKeys = new Set(ALL_EXERCISE_KEYS);
    for (const day of PROGRAM) {
      for (const ex of day.exercises) {
        expect(allKeys.has(ex.key as any)).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/program.test.ts --no-cache
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/program.ts src/__tests__/program.test.ts
git commit -m "feat: add types and hardcoded program definition"
```

---

### Task 3: Storage Layer

**Files:**
- Create: `src/storage.ts`, `src/__tests__/storage.test.ts`

- [ ] **Step 1: Write storage helpers**

Create `src/storage.ts`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Settings,
  CycleState,
  ExerciseWeight,
  WorkoutLog,
  CurrentSession,
} from "./types";

const KEYS = {
  settings: "settings",
  cycleState: "cycleState",
  weights: "weights",
  history: "history",
  currentSession: "currentSession",
  onboardingComplete: "onboardingComplete",
} as const;

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getSettings(): Promise<Settings | null> {
  return getJSON<Settings>(KEYS.settings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  return setJSON(KEYS.settings, settings);
}

export async function getCycleState(): Promise<CycleState | null> {
  return getJSON<CycleState>(KEYS.cycleState);
}

export async function saveCycleState(state: CycleState): Promise<void> {
  return setJSON(KEYS.cycleState, state);
}

export async function getWeights(): Promise<Record<string, ExerciseWeight> | null> {
  return getJSON<Record<string, ExerciseWeight>>(KEYS.weights);
}

export async function saveWeights(
  weights: Record<string, ExerciseWeight>
): Promise<void> {
  return setJSON(KEYS.weights, weights);
}

export async function getHistory(): Promise<WorkoutLog[]> {
  return (await getJSON<WorkoutLog[]>(KEYS.history)) ?? [];
}

export async function appendWorkout(workout: WorkoutLog): Promise<void> {
  const history = await getHistory();
  history.push(workout);
  return setJSON(KEYS.history, history);
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  return getJSON<CurrentSession>(KEYS.currentSession);
}

export async function saveCurrentSession(
  session: CurrentSession | null
): Promise<void> {
  if (session === null) {
    return AsyncStorage.removeItem(KEYS.currentSession);
  }
  return setJSON(KEYS.currentSession, session);
}

export async function isOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.onboardingComplete);
  return val === "true";
}

export async function setOnboardingComplete(): Promise<void> {
  return AsyncStorage.setItem(KEYS.onboardingComplete, "true");
}

export async function exportAllData(): Promise<string> {
  const keys = Object.values(KEYS);
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, any> = {};
  for (const [key, value] of pairs) {
    if (value !== null) {
      data[key] = JSON.parse(value);
    }
  }
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json) as Record<string, any>;
  const pairs: [string, string][] = Object.entries(data).map(([key, value]) => [
    key,
    JSON.stringify(value),
  ]);
  await AsyncStorage.multiSet(pairs);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
```

- [ ] **Step 2: Write storage tests**

Create `src/__tests__/storage.test.ts`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSettings,
  saveSettings,
  getCycleState,
  saveCycleState,
  getHistory,
  appendWorkout,
  getCurrentSession,
  saveCurrentSession,
  exportAllData,
  importAllData,
  clearAllData,
  isOnboardingComplete,
  setOnboardingComplete,
} from "../storage";
import { Settings, CycleState, WorkoutLog } from "../types";

// AsyncStorage mock is provided by @react-native-async-storage/async-storage/jest/async-storage-mock

beforeEach(async () => {
  await AsyncStorage.clear();
});

const mockSettings: Settings = {
  restTimerCompound: 180,
  restTimerAccessory: 90,
  units: "lb",
  increments: { bench_4: 5, squat_4: 10 },
  nutrition: null,
};

const mockCycleState: CycleState = {
  cycleNumber: 1,
  weekNumber: 1,
  nextDay: 1,
  isDeload: false,
};

describe("storage", () => {
  test("settings round-trip", async () => {
    expect(await getSettings()).toBeNull();
    await saveSettings(mockSettings);
    expect(await getSettings()).toEqual(mockSettings);
  });

  test("cycleState round-trip", async () => {
    expect(await getCycleState()).toBeNull();
    await saveCycleState(mockCycleState);
    expect(await getCycleState()).toEqual(mockCycleState);
  });

  test("history starts empty, appendWorkout adds entries", async () => {
    expect(await getHistory()).toEqual([]);
    const workout: WorkoutLog = {
      id: "test-1",
      date: "2026-05-12",
      day: 1,
      week: 1,
      cycle: 1,
      exercises: [],
      completedAt: null,
    };
    await appendWorkout(workout);
    const history = await getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("test-1");
  });

  test("currentSession can be set and cleared", async () => {
    expect(await getCurrentSession()).toBeNull();
    await saveCurrentSession({
      startedAt: "2026-05-12T10:00:00Z",
      day: 1,
      week: 1,
      cycle: 1,
      exercises: [],
    });
    expect(await getCurrentSession()).not.toBeNull();
    await saveCurrentSession(null);
    expect(await getCurrentSession()).toBeNull();
  });

  test("onboarding flag", async () => {
    expect(await isOnboardingComplete()).toBe(false);
    await setOnboardingComplete();
    expect(await isOnboardingComplete()).toBe(true);
  });

  test("export and import round-trip", async () => {
    await saveSettings(mockSettings);
    await saveCycleState(mockCycleState);
    const exported = await exportAllData();
    await clearAllData();
    expect(await getSettings()).toBeNull();
    await importAllData(exported);
    expect(await getSettings()).toEqual(mockSettings);
    expect(await getCycleState()).toEqual(mockCycleState);
  });
});
```

- [ ] **Step 3: Configure jest for AsyncStorage mock**

Add to `package.json` (or `jest.config.js` if it exists):

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFiles": ["./node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js"]
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/storage.test.ts --no-cache
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage.ts src/__tests__/storage.test.ts package.json
git commit -m "feat: add typed AsyncStorage helpers with export/import"
```

---

### Task 4: Cycle State Machine Hook

**Files:**
- Create: `src/hooks/useCycleState.ts`, `src/__tests__/useCycleState.test.ts`

- [ ] **Step 1: Write the cycle state machine logic**

Create `src/hooks/useCycleState.ts`:

```typescript
import { CycleState, TrainingDay, WeekNumber, ExerciseWeight } from "../types";
import { DAY_SEQUENCE, COMPOUND_KEYS } from "../program";

export function advanceCycleState(current: CycleState): CycleState {
  const dayIndex = DAY_SEQUENCE.indexOf(current.nextDay);
  const nextDayIndex = dayIndex + 1;

  if (nextDayIndex < DAY_SEQUENCE.length) {
    return { ...current, nextDay: DAY_SEQUENCE[nextDayIndex] };
  }

  // Wrapped past Day 6 → new week
  const nextWeek = current.weekNumber + 1;
  if (nextWeek <= 3) {
    return {
      ...current,
      weekNumber: nextWeek as WeekNumber,
      nextDay: DAY_SEQUENCE[0],
    };
  }

  // Wrapped past Week 3 → new cycle
  const nextCycle = current.cycleNumber + 1;
  return {
    cycleNumber: nextCycle,
    weekNumber: 1,
    nextDay: DAY_SEQUENCE[0],
    isDeload: nextCycle % 6 === 0,
  };
}

export function resetPrsForNewCycle(
  weights: Record<string, ExerciseWeight>,
  increments: Record<string, number>,
  cycleNumber: number
): Record<string, ExerciseWeight> {
  const updated = { ...weights };
  for (const key of COMPOUND_KEYS) {
    if (!updated[key]) continue;
    const w = updated[key];

    if (cycleNumber === 1) {
      updated[key] = { ...w, pr: null, prStatus: null };
    } else {
      // If previous cycle's PR succeeded through all weeks, it's the new working weight
      if (w.prStatus === "succeeded") {
        updated[key] = {
          working: w.pr!,
          pr: w.pr! + (increments[key] ?? 5),
          prStatus: "pending",
        };
      } else {
        updated[key] = {
          ...w,
          pr: w.working + (increments[key] ?? 5),
          prStatus: "pending",
        };
      }
    }
  }
  return updated;
}

export function createInitialCycleState(): CycleState {
  return {
    cycleNumber: 1,
    weekNumber: 1,
    nextDay: 1,
    isDeload: false,
  };
}
```

- [ ] **Step 2: Write tests**

Create `src/__tests__/useCycleState.test.ts`:

```typescript
import { advanceCycleState, resetPrsForNewCycle, createInitialCycleState } from "../hooks/useCycleState";
import { CycleState, ExerciseWeight } from "../types";

describe("advanceCycleState", () => {
  test("advances day within same week", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 1, nextDay: 1, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(2);
    expect(next.weekNumber).toBe(1);
    expect(next.cycleNumber).toBe(1);
  });

  test("advances from day 3 to day 5 (skips 4)", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 1, nextDay: 3, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(5);
  });

  test("wraps from day 6 to day 1 of next week", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 1, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(1);
    expect(next.weekNumber).toBe(2);
    expect(next.cycleNumber).toBe(1);
  });

  test("wraps from week 3 day 6 to new cycle", () => {
    const state: CycleState = { cycleNumber: 1, weekNumber: 3, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.nextDay).toBe(1);
    expect(next.weekNumber).toBe(1);
    expect(next.cycleNumber).toBe(2);
    expect(next.isDeload).toBe(false);
  });

  test("cycle 5 wraps to cycle 6 which is deload", () => {
    const state: CycleState = { cycleNumber: 5, weekNumber: 3, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.cycleNumber).toBe(6);
    expect(next.isDeload).toBe(true);
  });

  test("cycle 11 wraps to cycle 12 which is deload", () => {
    const state: CycleState = { cycleNumber: 11, weekNumber: 3, nextDay: 6, isDeload: false };
    const next = advanceCycleState(state);
    expect(next.cycleNumber).toBe(12);
    expect(next.isDeload).toBe(true);
  });
});

describe("resetPrsForNewCycle", () => {
  test("cycle 1 sets pr to null", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: null, prStatus: null },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 1);
    expect(result.bench_4.pr).toBeNull();
    expect(result.bench_4.prStatus).toBeNull();
  });

  test("cycle 2+ sets pr to working + increment", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: null, prStatus: null },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 2);
    expect(result.bench_4.pr).toBe(140);
    expect(result.bench_4.prStatus).toBe("pending");
  });

  test("succeeded PR becomes new working weight", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: 140, prStatus: "succeeded" },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 3);
    expect(result.bench_4.working).toBe(140);
    expect(result.bench_4.pr).toBe(145);
    expect(result.bench_4.prStatus).toBe("pending");
  });

  test("failed PR keeps working weight", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: 140, prStatus: "failed" },
    };
    const result = resetPrsForNewCycle(weights, { bench_4: 5 }, 3);
    expect(result.bench_4.working).toBe(135);
    expect(result.bench_4.pr).toBe(140);
    expect(result.bench_4.prStatus).toBe("pending");
  });

  test("defaults to 5lb increment when not configured", () => {
    const weights: Record<string, ExerciseWeight> = {
      bench_4: { working: 135, pr: null, prStatus: null },
    };
    const result = resetPrsForNewCycle(weights, {}, 2);
    expect(result.bench_4.pr).toBe(140);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest src/__tests__/useCycleState.test.ts --no-cache
```

Expected: All 11 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCycleState.ts src/__tests__/useCycleState.test.ts
git commit -m "feat: add cycle state machine with PR reset logic"
```

---

### Task 5: Nutrition Calculator Hook

**Files:**
- Create: `src/hooks/useNutrition.ts`, `src/__tests__/useNutrition.test.ts`

- [ ] **Step 1: Write the calculator**

Create `src/hooks/useNutrition.ts`:

```typescript
import { NutritionSettings, NutritionTargets, Units } from "../types";

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_OFFSETS: Record<string, number> = {
  bulk: 400,
  cut: -400,
  maintain: 0,
};

export function calculateNutrition(
  nutrition: NutritionSettings,
  units: Units
): NutritionTargets {
  // Mifflin-St Jeor needs kg and cm
  const weightKg =
    units === "kg" ? nutrition.weight : nutrition.weight * 0.453592;
  const heightCm =
    units === "kg" ? nutrition.height : nutrition.height * 2.54;

  let bmr: number;
  if (nutrition.sex === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * nutrition.age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * nutrition.age - 161;
  }

  const tdee = bmr * ACTIVITY_MULTIPLIERS[nutrition.activityLevel];
  const calories = Math.round(tdee + GOAL_OFFSETS[nutrition.goal]);

  // Protein: 1g per lb bodyweight (2.2g per kg)
  const weightLb =
    units === "lb" ? nutrition.weight : nutrition.weight * 2.20462;
  const protein = Math.round(weightLb);

  // Fat: 25% of calories (9 cal/g)
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: remainder (4 cal/g)
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.round((calories - proteinCals - fatCals) / 4);

  return { calories, protein, fat, carbs };
}
```

- [ ] **Step 2: Write tests**

Create `src/__tests__/useNutrition.test.ts`:

```typescript
import { calculateNutrition } from "../hooks/useNutrition";
import { NutritionSettings } from "../types";

const baseSettings: NutritionSettings = {
  age: 25,
  weight: 180,    // lb
  height: 70,     // inches
  sex: "male",
  activityLevel: "moderate",
  goal: "maintain",
};

describe("calculateNutrition", () => {
  test("returns whole numbers for all fields", () => {
    const result = calculateNutrition(baseSettings, "lb");
    expect(Number.isInteger(result.calories)).toBe(true);
    expect(Number.isInteger(result.protein)).toBe(true);
    expect(Number.isInteger(result.fat)).toBe(true);
    expect(Number.isInteger(result.carbs)).toBe(true);
  });

  test("protein equals body weight in lbs", () => {
    const result = calculateNutrition(baseSettings, "lb");
    expect(result.protein).toBe(180);
  });

  test("protein in kg mode uses 2.2 conversion", () => {
    const kgSettings: NutritionSettings = {
      ...baseSettings,
      weight: 82,     // kg
      height: 178,    // cm
    };
    const result = calculateNutrition(kgSettings, "kg");
    expect(result.protein).toBe(Math.round(82 * 2.20462));
  });

  test("bulk adds ~400 calories vs maintain", () => {
    const maintain = calculateNutrition(baseSettings, "lb");
    const bulk = calculateNutrition({ ...baseSettings, goal: "bulk" }, "lb");
    expect(bulk.calories - maintain.calories).toBe(400);
  });

  test("cut subtracts ~400 calories vs maintain", () => {
    const maintain = calculateNutrition(baseSettings, "lb");
    const cut = calculateNutrition({ ...baseSettings, goal: "cut" }, "lb");
    expect(maintain.calories - cut.calories).toBe(400);
  });

  test("female BMR is lower than male for same stats", () => {
    const male = calculateNutrition(baseSettings, "lb");
    const female = calculateNutrition({ ...baseSettings, sex: "female" }, "lb");
    expect(female.calories).toBeLessThan(male.calories);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest src/__tests__/useNutrition.test.ts --no-cache
```

Expected: All 6 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useNutrition.ts src/__tests__/useNutrition.test.ts
git commit -m "feat: add Mifflin-St Jeor nutrition calculator"
```

---

### Task 6: Rest Timer Hook

**Files:**
- Create: `src/hooks/useTimer.ts`, `src/__tests__/useTimer.test.ts`

- [ ] **Step 1: Write the timer hook**

Create `src/hooks/useTimer.ts`:

```typescript
import { useState, useRef, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  totalSeconds: number;
}

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    secondsLeft: 0,
    isRunning: false,
    totalSeconds: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clear();
      setState({ secondsLeft: seconds, isRunning: true, totalSeconds: seconds });
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.secondsLeft <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return { ...prev, secondsLeft: 0, isRunning: false };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    },
    [clear]
  );

  const dismiss = useCallback(() => {
    clear();
    setState((prev) => ({ ...prev, secondsLeft: 0, isRunning: false }));
  }, [clear]);

  const extend = useCallback((extraSeconds: number) => {
    setState((prev) => ({
      ...prev,
      secondsLeft: prev.secondsLeft + extraSeconds,
      totalSeconds: prev.totalSeconds + extraSeconds,
    }));
  }, []);

  useEffect(() => {
    return clear;
  }, [clear]);

  return {
    secondsLeft: state.secondsLeft,
    isRunning: state.isRunning,
    totalSeconds: state.totalSeconds,
    progress: state.totalSeconds > 0
      ? 1 - state.secondsLeft / state.totalSeconds
      : 0,
    start,
    dismiss,
    extend,
  };
}
```

- [ ] **Step 2: Write tests**

Create `src/__tests__/useTimer.test.ts`:

```typescript
import { renderHook, act } from "@testing-library/react-native";
import { useTimer } from "../hooks/useTimer";

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useTimer", () => {
  test("starts with 0 seconds and not running", () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  test("start begins countdown", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start(60));
    expect(result.current.secondsLeft).toBe(60);
    expect(result.current.isRunning).toBe(true);
  });

  test("countdown decrements each second", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start(5));
    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(3);
  });

  test("dismiss stops timer immediately", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start(60));
    act(() => result.current.dismiss());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.secondsLeft).toBe(0);
  });

  test("extend adds time", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start(60));
    act(() => jest.advanceTimersByTime(10000));
    act(() => result.current.extend(30));
    expect(result.current.secondsLeft).toBe(80);
  });

  test("progress is 0 to 1", () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start(10));
    expect(result.current.progress).toBeCloseTo(0);
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.progress).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 3: Install testing library if not present**

```bash
npm install -D @testing-library/react-native
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/useTimer.test.ts --no-cache
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTimer.ts src/__tests__/useTimer.test.ts
git commit -m "feat: add rest timer hook with dismiss/extend"
```

---

### Task 7: App Context + Workout Session Hook

**Files:**
- Create: `src/context.tsx`, `src/hooks/useWorkout.ts`, `src/__tests__/useWorkout.test.ts`

- [ ] **Step 1: Write app context provider**

Create `src/context.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Settings,
  CycleState,
  ExerciseWeight,
  WorkoutLog,
  CurrentSession,
} from "./types";
import * as storage from "./storage";
import { createInitialCycleState } from "./hooks/useCycleState";

interface AppState {
  settings: Settings | null;
  cycleState: CycleState | null;
  weights: Record<string, ExerciseWeight>;
  history: WorkoutLog[];
  currentSession: CurrentSession | null;
  isLoading: boolean;
}

interface AppContextValue extends AppState {
  setSettings: (s: Settings) => Promise<void>;
  setCycleState: (c: CycleState) => Promise<void>;
  setWeights: (w: Record<string, ExerciseWeight>) => Promise<void>;
  addWorkout: (w: WorkoutLog) => Promise<void>;
  setCurrentSession: (s: CurrentSession | null) => Promise<void>;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    settings: null,
    cycleState: null,
    weights: {},
    history: [],
    currentSession: null,
    isLoading: true,
  });

  const load = async () => {
    const [settings, cycleState, weights, history, currentSession] =
      await Promise.all([
        storage.getSettings(),
        storage.getCycleState(),
        storage.getWeights(),
        storage.getHistory(),
        storage.getCurrentSession(),
      ]);
    setState({
      settings,
      cycleState,
      weights: weights ?? {},
      history,
      currentSession,
      isLoading: false,
    });
  };

  useEffect(() => {
    load();
  }, []);

  const value: AppContextValue = {
    ...state,
    setSettings: async (s) => {
      await storage.saveSettings(s);
      setState((prev) => ({ ...prev, settings: s }));
    },
    setCycleState: async (c) => {
      await storage.saveCycleState(c);
      setState((prev) => ({ ...prev, cycleState: c }));
    },
    setWeights: async (w) => {
      await storage.saveWeights(w);
      setState((prev) => ({ ...prev, weights: w }));
    },
    addWorkout: async (w) => {
      await storage.appendWorkout(w);
      setState((prev) => ({ ...prev, history: [...prev.history, w] }));
    },
    setCurrentSession: async (s) => {
      await storage.saveCurrentSession(s);
      setState((prev) => ({ ...prev, currentSession: s }));
    },
    reload: load,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be inside AppProvider");
  return ctx;
}
```

- [ ] **Step 2: Write workout session hook**

Create `src/hooks/useWorkout.ts`:

```typescript
import { v4 as uuid } from "uuid";
import * as Haptics from "expo-haptics";
import {
  CurrentSession,
  ExerciseLog,
  SetLog,
  WorkoutLog,
  ProgramExercise,
  ExerciseWeight,
  CycleState,
} from "../types";
import { getProgramDay, getSetsForWeek } from "../program";
import { advanceCycleState, resetPrsForNewCycle } from "./useCycleState";
import { useAppContext } from "../context";

export function buildSessionExercises(
  cycleState: CycleState,
  weights: Record<string, ExerciseWeight>
): ExerciseLog[] {
  const programDay = getProgramDay(cycleState.nextDay);
  const exercises: ExerciseLog[] = [];

  for (const ex of programDay.exercises) {
    const setCount = getSetsForWeek(ex, cycleState.weekNumber, cycleState.isDeload);
    if (setCount === 0) continue;

    exercises.push({
      name: ex.name,
      key: ex.key,
      reps: ex.reps,
      type: ex.type,
      sets: [],
    });
  }

  return exercises;
}

export function getTargetWeight(
  exerciseKey: string,
  weights: Record<string, ExerciseWeight>,
  cycleState: CycleState
): number {
  const w = weights[exerciseKey];
  if (!w) return 0;

  if (cycleState.cycleNumber === 1) return w.working;
  if (w.prStatus === "pending" || w.prStatus === "succeeded") {
    return w.pr ?? w.working;
  }
  return w.working;
}

export function getTargetSets(
  exerciseKey: string,
  cycleState: CycleState,
  programExercises: ProgramExercise[]
): number {
  const ex = programExercises.find((e) => e.key === exerciseKey);
  if (!ex) return 0;
  return getSetsForWeek(ex, cycleState.weekNumber, cycleState.isDeload);
}

export function useWorkout() {
  const ctx = useAppContext();

  const startWorkout = async (): Promise<CurrentSession> => {
    const session: CurrentSession = {
      startedAt: new Date().toISOString(),
      day: ctx.cycleState!.nextDay,
      week: ctx.cycleState!.weekNumber,
      cycle: ctx.cycleState!.cycleNumber,
      exercises: buildSessionExercises(ctx.cycleState!, ctx.weights),
    };
    await ctx.setCurrentSession(session);
    return session;
  };

  const logSet = async (
    exerciseIndex: number,
    set: SetLog
  ): Promise<void> => {
    if (!ctx.currentSession) return;
    const updated = { ...ctx.currentSession };
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = {
      ...updated.exercises[exerciseIndex],
      sets: [...updated.exercises[exerciseIndex].sets, set],
    };
    await ctx.setCurrentSession(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const failPr = async (exerciseKey: string): Promise<void> => {
    const w = ctx.weights[exerciseKey];
    if (!w) return;
    const updated = {
      ...ctx.weights,
      [exerciseKey]: { ...w, prStatus: "failed" as const },
    };
    await ctx.setWeights(updated);
  };

  const finishWorkout = async (): Promise<WorkoutLog> => {
    const session = ctx.currentSession!;
    const workout: WorkoutLog = {
      id: uuid(),
      date: new Date().toISOString().split("T")[0],
      day: session.day,
      week: session.week,
      cycle: session.cycle,
      exercises: session.exercises,
      completedAt: new Date().toISOString(),
    };
    await ctx.addWorkout(workout);

    // Check PR success: if all PR sets in all exercises completed target reps
    const updatedWeights = { ...ctx.weights };
    for (const ex of session.exercises) {
      if (ex.type === "black") continue;
      const w = updatedWeights[ex.key];
      if (!w || w.prStatus !== "pending") continue;

      const allPrSetsHitTarget = ex.sets
        .filter((s) => s.isPr)
        .every((s) => s.reps >= ex.reps);

      if (allPrSetsHitTarget && ex.sets.filter((s) => s.isPr).length > 0) {
        updatedWeights[ex.key] = { ...w, prStatus: "succeeded" };
      }
    }
    await ctx.setWeights(updatedWeights);

    // Advance cycle state
    const nextState = advanceCycleState(ctx.cycleState!);

    // If new cycle, reset PRs
    if (nextState.cycleNumber !== ctx.cycleState!.cycleNumber) {
      const resetWeights = resetPrsForNewCycle(
        updatedWeights,
        ctx.settings!.increments,
        nextState.cycleNumber
      );
      await ctx.setWeights(resetWeights);
    }

    await ctx.setCycleState(nextState);
    await ctx.setCurrentSession(null);

    return workout;
  };

  const discardWorkout = async (): Promise<void> => {
    await ctx.setCurrentSession(null);
  };

  return {
    currentSession: ctx.currentSession,
    startWorkout,
    logSet,
    failPr,
    finishWorkout,
    discardWorkout,
  };
}
```

- [ ] **Step 3: Write tests for buildSessionExercises and getTargetWeight**

Create `src/__tests__/useWorkout.test.ts`:

```typescript
import { buildSessionExercises, getTargetWeight } from "../hooks/useWorkout";
import { CycleState, ExerciseWeight } from "../types";

const baseCycle: CycleState = {
  cycleNumber: 2,
  weekNumber: 1,
  nextDay: 1,
  isDeload: false,
};

const weights: Record<string, ExerciseWeight> = {
  deadlift_4: { working: 225, pr: 235, prStatus: "pending" },
  chinups_8: { working: 0, pr: 5, prStatus: "pending" },
  bb_rows_4: { working: 135, pr: 140, prStatus: "pending" },
  curls_12: { working: 30, pr: null, prStatus: null },
};

describe("buildSessionExercises", () => {
  test("Day 1 Week 1 includes all 4 exercises", () => {
    const exercises = buildSessionExercises(baseCycle, weights);
    expect(exercises).toHaveLength(4);
    expect(exercises.map((e) => e.key)).toEqual([
      "deadlift_4",
      "chinups_8",
      "bb_rows_4",
      "curls_12",
    ]);
  });

  test("Day 1 Week 3 excludes deadlift (0 sets)", () => {
    const cycle = { ...baseCycle, weekNumber: 3 as const };
    const exercises = buildSessionExercises(cycle, weights);
    expect(exercises.map((e) => e.key)).not.toContain("deadlift_4");
    expect(exercises).toHaveLength(3);
  });

  test("deload week 1 excludes deadlift (2-2=0)", () => {
    const cycle = { ...baseCycle, isDeload: true };
    const exercises = buildSessionExercises(cycle, weights);
    expect(exercises.map((e) => e.key)).not.toContain("deadlift_4");
  });

  test("exercises start with empty sets array", () => {
    const exercises = buildSessionExercises(baseCycle, weights);
    for (const ex of exercises) {
      expect(ex.sets).toEqual([]);
    }
  });
});

describe("getTargetWeight", () => {
  test("cycle 1 returns working weight", () => {
    const cycle1 = { ...baseCycle, cycleNumber: 1 };
    expect(getTargetWeight("deadlift_4", weights, cycle1)).toBe(225);
  });

  test("cycle 2+ with pending PR returns PR weight", () => {
    expect(getTargetWeight("deadlift_4", weights, baseCycle)).toBe(235);
  });

  test("cycle 2+ with failed PR returns working weight", () => {
    const failedWeights = {
      ...weights,
      deadlift_4: { working: 225, pr: 235, prStatus: "failed" as const },
    };
    expect(getTargetWeight("deadlift_4", failedWeights, baseCycle)).toBe(225);
  });

  test("black exercise returns working weight regardless", () => {
    expect(getTargetWeight("curls_12", weights, baseCycle)).toBe(30);
  });

  test("missing key returns 0", () => {
    expect(getTargetWeight("nonexistent_4", weights, baseCycle)).toBe(0);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/useWorkout.test.ts --no-cache
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context.tsx src/hooks/useWorkout.ts src/__tests__/useWorkout.test.ts
git commit -m "feat: add app context and workout session hook"
```

---

### Task 8: Navigation Shell + Root Layout

**Files:**
- Create/Modify: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/progress.tsx`, `app/(tabs)/history.tsx`, `app/(tabs)/settings.tsx`, `app/workout.tsx`, `app/onboarding.tsx`

- [ ] **Step 1: Write root layout**

Create `app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
import { AppProvider } from "../src/context";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="workout"
          options={{ presentation: "fullScreenModal", gestureEnabled: false }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ presentation: "fullScreenModal", gestureEnabled: false }}
        />
      </Stack>
    </AppProvider>
  );
}
```

- [ ] **Step 2: Write tabs layout**

Create `app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#111", borderTopColor: "#333" },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#888",
        headerStyle: { backgroundColor: "#111" },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Write placeholder screens**

Create `app/(tabs)/index.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Today</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  text: { color: "#fff", fontSize: 24 },
});
```

Create `app/(tabs)/progress.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Progress</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  text: { color: "#fff", fontSize: 24 },
});
```

Create `app/(tabs)/history.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>History</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  text: { color: "#fff", fontSize: 24 },
});
```

Create `app/(tabs)/settings.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  text: { color: "#fff", fontSize: 24 },
});
```

Create `app/workout.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function WorkoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Active Workout</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  text: { color: "#fff", fontSize: 24 },
});
```

Create `app/onboarding.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  text: { color: "#fff", fontSize: 24 },
});
```

- [ ] **Step 4: Run the app and verify navigation**

```bash
npx expo start
```

Expected: App launches with bottom tab bar showing Today, Progress, History, Settings. All tabs navigate correctly. Dark background on all screens.

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: add navigation shell with tabs and modal routes"
```

---

### Task 9: Onboarding Screen

**Files:**
- Modify: `app/onboarding.tsx`, `app/_layout.tsx`

- [ ] **Step 1: Write onboarding screen**

Replace `app/onboarding.tsx` with the full onboarding wizard. This is a multi-step form: units → weights → rest timer → nutrition (optional). Use the `frontend-design` skill for polished UI.

The onboarding screen must:
- Step 1: Pick units (lb/kg) — two large tap targets
- Step 2: Enter starting weight for each compound lift. Show exercise name, number input. Chinups labeled "Added Weight (0 = bodyweight)". Pre-fill with sensible defaults (e.g., 135lb squat, 95lb bench for a starting lifter).
- Step 3: Rest timer — two sliders or pickers for compound (default 180s) and accessory (default 90s)
- Step 4: Nutrition (optional skip) — age, weight, height, sex, activity level, goal
- Final: Save to AsyncStorage via context, mark onboarding complete, set `cycleState` to initial, navigate to `/(tabs)`

The root layout should check `isOnboardingComplete()` on load and redirect to `/onboarding` if false.

- [ ] **Step 2: Update root layout to gate on onboarding**

Modify `app/_layout.tsx` to check onboarding status:

```tsx
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AppProvider, useAppContext } from "../src/context";
import { isOnboardingComplete } from "../src/storage";

function RootNavigator() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    isOnboardingComplete().then(setOnboarded);
  }, []);

  useEffect(() => {
    if (onboarded === null) return;
    if (!onboarded && segments[0] !== "onboarding") {
      router.replace("/onboarding");
    }
  }, [onboarded, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="workout"
        options={{ presentation: "fullScreenModal", gestureEnabled: false }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ presentation: "fullScreenModal", gestureEnabled: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
```

- [ ] **Step 3: Test onboarding flow manually**

```bash
npx expo start
```

Expected: First launch shows onboarding. Complete all steps. After completion, app shows Today tab. Kill and reopen — goes straight to Today.

- [ ] **Step 4: Commit**

```bash
git add app/onboarding.tsx app/_layout.tsx
git commit -m "feat: add onboarding wizard with weight/timer/nutrition setup"
```

---

### Task 10: Today / Home Screen

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Create: `src/components/ExerciseCard.tsx`, `src/components/NutritionCard.tsx`

- [ ] **Step 1: Write ExerciseCard component**

Create `src/components/ExerciseCard.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { ExerciseType } from "../types";

interface Props {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  type: ExerciseType;
  isResting: boolean;
  units: string;
  isChinups: boolean;
}

const TYPE_COLORS: Record<ExerciseType, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  black: "#A3A3A3",
};

export function ExerciseCard({ name, sets, reps, weight, type, isResting, units, isChinups }: Props) {
  if (isResting) {
    return (
      <View style={[styles.card, styles.restingCard]}>
        <Text style={styles.restingName}>{name}</Text>
        <Text style={styles.restingLabel}>Rest this week</Text>
      </View>
    );
  }

  const weightLabel = isChinups
    ? `+${weight}${units} added`
    : `${weight}${units}`;

  return (
    <View style={[styles.card, { borderLeftColor: TYPE_COLORS[type] }]}>
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.weight}>{weightLabel}</Text>
      </View>
      <Text style={styles.setsReps}>
        {sets} × {type === "black" ? `AMRAP (~${reps})` : reps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#333",
  },
  restingCard: {
    opacity: 0.4,
    borderLeftColor: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { color: "#fff", fontSize: 18, fontWeight: "700" },
  weight: { color: "#ccc", fontSize: 16, fontWeight: "600" },
  setsReps: { color: "#888", fontSize: 14, marginTop: 4 },
  restingName: { color: "#666", fontSize: 18, fontWeight: "700" },
  restingLabel: { color: "#555", fontSize: 14, marginTop: 4, fontStyle: "italic" },
});
```

- [ ] **Step 2: Write NutritionCard component**

Create `src/components/NutritionCard.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { NutritionTargets } from "../types";

interface Props {
  targets: NutritionTargets;
}

export function NutritionCard({ targets }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Daily Targets</Text>
      <Text style={styles.calories}>{targets.calories} cal</Text>
      <View style={styles.macros}>
        <MacroPill label="Protein" value={`${targets.protein}g`} color="#4CAF50" />
        <MacroPill label="Carbs" value={`${targets.carbs}g`} color="#FF9800" />
        <MacroPill label="Fat" value={`${targets.fat}g`} color="#2196F3" />
      </View>
    </View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: { color: "#888", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  calories: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 4 },
  macros: { flexDirection: "row", gap: 8, marginTop: 12 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  pillValue: { fontSize: 16, fontWeight: "700" },
  pillLabel: { color: "#888", fontSize: 11, marginTop: 2 },
});
```

- [ ] **Step 3: Write the Today screen**

Replace `app/(tabs)/index.tsx` with the full Home screen that reads from context, shows exercise cards, nutrition card, resume prompt, and Start Workout button. The screen should:

- Read `cycleState`, `weights`, `settings`, `currentSession` from context
- Show header: "Day {N} — Week {W}, Cycle {C}" (or "Deload Cycle")
- On rest day: "Rest Day — Hit Abs" + next workout preview
- List exercises for today using `ExerciseCard` (0-set exercises shown as resting)
- Show `NutritionCard` if nutrition configured
- "Start Workout" button at bottom → `router.push("/workout")`
- If `currentSession` exists → "Resume Workout?" prompt at top

- [ ] **Step 4: Test in Expo**

```bash
npx expo start
```

Expected: After onboarding, Today screen shows correct day/week/cycle, exercise list with colored left borders, weights pre-filled, nutrition card if configured, Start Workout button.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExerciseCard.tsx src/components/NutritionCard.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add Today screen with exercise cards and nutrition summary"
```

---

### Task 11: Active Workout Screen

**Files:**
- Modify: `app/workout.tsx`
- Create: `src/components/SetLogger.tsx`, `src/components/RestTimer.tsx`, `src/components/WorkoutSummary.tsx`

- [ ] **Step 1: Write SetLogger component**

Create `src/components/SetLogger.tsx` — shows current exercise, set number, pre-filled weight/reps, "Complete Set" button, +/- weight for AMRAP, previous performance inline, PR badge.

- [ ] **Step 2: Write RestTimer component**

Create `src/components/RestTimer.tsx` — countdown bar at bottom. Shows "M:SS" countdown. Dismiss and +30s buttons. Uses `useTimer` hook. Progress bar fills left to right.

- [ ] **Step 3: Write WorkoutSummary component**

Create `src/components/WorkoutSummary.tsx` — shows after last set. Lists exercises completed, total sets, PRs hit. "Finish" button saves and returns to Today.

- [ ] **Step 4: Write the Active Workout screen**

Replace `app/workout.tsx` with the full guided workout flow:

- On mount: call `startWorkout()` (or resume from `currentSession`)
- Walk through exercises in order. For each exercise, walk through sets.
- Per set: show `SetLogger` with pre-filled weight (from `getTargetWeight`) and target reps
- On "Complete Set": call `logSet()`, start rest timer, advance to next set
- For AMRAP: show weight +/- buttons, user enters actual reps
- For PR sets: show PR badge, if user fails to hit reps → call `failPr()` and prompt
- After all exercises done: show `WorkoutSummary`
- "Finish" calls `finishWorkout()` → back to Today
- "Discard" calls `discardWorkout()` → back to Today (with confirmation)

- [ ] **Step 5: Test complete workout flow**

```bash
npx expo start
```

Expected: Start workout from Today → guided through each exercise/set → rest timer after each set → PR badges on compound sets → AMRAP weight adjustment works → summary at end → Finish returns to Today with cycleState advanced.

- [ ] **Step 6: Commit**

```bash
git add src/components/SetLogger.tsx src/components/RestTimer.tsx src/components/WorkoutSummary.tsx app/workout.tsx
git commit -m "feat: add active workout screen with guided logging and rest timer"
```

---

### Task 12: Progress Screen

**Files:**
- Modify: `app/(tabs)/progress.tsx`
- Create: `src/components/ProgressChart.tsx`

- [ ] **Step 1: Write ProgressChart component**

Create `src/components/ProgressChart.tsx` using victory-native:

- Line chart with X-axis = workout date, Y-axis = weight
- Two line series: working weight (solid) and PR attempts (dashed)
- Green dot for successful PR, red dot for failed
- Accepts `exerciseKey` prop and filters history

- [ ] **Step 2: Write the Progress screen**

Replace `app/(tabs)/progress.tsx`:

- Horizontal scrollable exercise picker at top (all compound exercise keys)
- Selected exercise shows `ProgressChart`
- Below chart: current working weights dashboard — grid of all compounds with name + weight
- 1RM estimate per exercise (Epley formula: weight × (1 + reps/30) from heaviest logged set)

- [ ] **Step 3: Test with workout history data**

Run through at least 2 workouts via the app, then check Progress tab.

Expected: Chart shows data points, exercise picker works, working weights grid is correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProgressChart.tsx app/\(tabs\)/progress.tsx
git commit -m "feat: add progress screen with exercise charts and working weights"
```

---

### Task 13: History Screen

**Files:**
- Modify: `app/(tabs)/history.tsx`
- Create: `src/components/CalendarGrid.tsx`

- [ ] **Step 1: Write CalendarGrid component**

Create `src/components/CalendarGrid.tsx`:

- Month grid showing day numbers
- Green dot under days with a completed workout
- Tap a day → expand below calendar to show session details
- Month navigation arrows (< previous / next >)

- [ ] **Step 2: Write the History screen**

Replace `app/(tabs)/history.tsx`:

- `CalendarGrid` at top
- When a workout day is tapped: show full session detail below calendar
- Session detail: "Day {N} — Week {W}, Cycle {C}" header, list of exercises with each set (weight × reps), volume summary (total sets)
- If no workout on tapped day: show nothing or "No workout"

- [ ] **Step 3: Test with history data**

Expected: Calendar shows dots on workout days. Tapping reveals session details with correct data.

- [ ] **Step 4: Commit**

```bash
git add src/components/CalendarGrid.tsx app/\(tabs\)/history.tsx
git commit -m "feat: add history screen with calendar view and session details"
```

---

### Task 14: Settings Screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Write the Settings screen**

Replace `app/(tabs)/settings.tsx` with full settings:

- **Weights section:** Scrollable list of all compound exercises with current working weight. Tap to edit.
- **Increments section:** Per-exercise increment amounts. Tap to edit.
- **Rest Timer section:** Two number inputs — compound (seconds) and accessory (seconds).
- **Units toggle:** lb / kg segmented control. Switching units does NOT convert existing weights.
- **Cycle Position section:** Editable cycle number, week number, next day. For manual corrections.
- **Nutrition Calculator section:** Form with age, weight, height, sex picker, activity level picker, goal picker. Shows calculated targets below form. "Clear" button to remove nutrition data.
- **Data section:** "Export Data" button (serialize all AsyncStorage → share sheet). "Import Data" button (file picker → parse JSON → overwrite with confirmation).

- [ ] **Step 2: Test all settings sections**

Expected: All fields save to AsyncStorage. Changing weights updates Today screen. Export produces valid JSON. Import restores state.

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/settings.tsx
git commit -m "feat: add settings screen with weights, timer, nutrition, export/import"
```

---

### Task 15: Polish + Design Pass

**Files:**
- All screen and component files

Use the `frontend-design` skill for this task. The goal is to take all functional screens and make them look polished — not generic AI slop.

- [ ] **Step 1: Apply consistent dark theme**

Define a shared color palette in `src/theme.ts`:

```typescript
export const colors = {
  bg: "#000",
  surface: "#1A1A1A",
  surfaceLight: "#262626",
  border: "#333",
  text: "#fff",
  textSecondary: "#888",
  textMuted: "#555",
  accent: "#4CAF50",
  red: "#EF4444",
  blue: "#3B82F6",
  orange: "#FF9800",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

- [ ] **Step 2: Design polish on each screen**

Apply design principles from the spec:
- Large touch targets (minimum 48×48 dp)
- Bold, minimal typography
- No unnecessary borders or shadows
- Consistent border-radius (12px for cards)
- Exercise type colors (red/blue/gray) used consistently
- Rest timer bar is visible but non-intrusive
- "Complete Set" button is oversized and easy to hit mid-set

- [ ] **Step 3: Test the full flow end-to-end**

Launch fresh (clear AsyncStorage). Walk through:
1. Onboarding → enter weights → set timer → skip nutrition
2. Today shows Day 1 Week 1 Cycle 1
3. Start Workout → complete all sets → rest timer works → finish
4. Today shows Day 2
5. Check Progress tab (has 1 data point)
6. Check History tab (shows today's workout)
7. Settings → change a weight → verify Today reflects it

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: design polish pass — dark theme, typography, touch targets"
```

---

### Task 16: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-cache
```

Expected: All tests pass.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Test on device via Expo Go**

```bash
npx expo start
```

Scan QR code with Expo Go. Walk through full workout cycle on physical device. Verify:
- Haptic feedback on set completion
- Rest timer countdown works
- App survives backgrounding and returning
- Data persists after killing and reopening the app

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during device testing"
```
