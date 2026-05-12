# Body Figure ("The Mirror") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a morphing SVG body figure that visually reflects the user's training history and body composition, with muscle growth, decay, and body fat effects.

**Architecture:** Pure computation engine (`useBodyModel`) processes workout history into per-muscle effective sizes. SVG figure component (`BodyFigure`) interpolates bezier control points between untrained/trained states based on those sizes. Body screen wires them together with a timeline slider for scrubbing through history.

**Tech Stack:** react-native-svg (already installed), react-native-reanimated (already installed), existing AsyncStorage/Context patterns.

---

## File Structure

```
src/
  types.ts                          # Add BodyLog, BodyModelState types
  storage.ts                        # Add bodyLog helpers
  context.tsx                       # Add bodyLog to state
  hooks/
    useBodyModel.ts                 # Pure computation: workout history → muscle states
  components/
    BodyFigure.tsx                  # SVG figure with morphing bezier paths
    body/
      paths.ts                      # All bezier control point data (base + trained)
      muscles.ts                    # Exercise-to-muscle mapping, muscle group constants
  __tests__/
    useBodyModel.test.ts            # Computation engine tests

app/(tabs)/
  _layout.tsx                       # Add Body tab
  body.tsx                          # Body screen with timeline slider
  settings.tsx                      # Add Body Measurements section
```

---

### Task 1: Types + Storage + Context

**Files:**
- Modify: `src/types.ts`
- Modify: `src/storage.ts`
- Modify: `src/context.tsx`

- [ ] **Step 1: Add BodyLog type and BodyModelState type**

Add to the end of `src/types.ts`:

```typescript
export interface BodyLog {
  date: string;
  weight: number;
  bodyFatPercent: number;
}

export interface BodyModelState {
  muscles: Record<string, number>;
  bodyFatPercent: number;
  bodyWeight: number;
  monthsTrained: number;
  peakMuscles: Record<string, number>;
}
```

- [ ] **Step 2: Add storage helpers**

Add to `src/storage.ts`. First add `BodyLog` to the import from `./types`. Then add `bodyLog` to the KEYS object:

```typescript
// In KEYS:
bodyLog: "bodyLog",
```

Then add these functions after the existing helpers:

```typescript
export async function getBodyLog(): Promise<BodyLog[]> {
  return (await getJSON<BodyLog[]>(KEYS.bodyLog)) ?? [];
}

export async function appendBodyLog(entry: BodyLog): Promise<void> {
  const log = await getBodyLog();
  log.push(entry);
  return setJSON(KEYS.bodyLog, log);
}

export async function saveBodyLog(log: BodyLog[]): Promise<void> {
  return setJSON(KEYS.bodyLog, log);
}
```

- [ ] **Step 3: Add bodyLog to context**

In `src/context.tsx`:

Add `BodyLog` to the import from `./types`.

Add to `AppState`:
```typescript
bodyLog: BodyLog[];
```

Add to `AppContextValue`:
```typescript
addBodyLog: (entry: BodyLog) => Promise<void>;
setBodyLog: (log: BodyLog[]) => Promise<void>;
```

Update initial state to include `bodyLog: []`.

Update `load` to also fetch `storage.getBodyLog()` and set it in state.

Add the setter functions:
```typescript
addBodyLog: async (entry) => {
  await storage.appendBodyLog(entry);
  setState((prev) => ({ ...prev, bodyLog: [...prev.bodyLog, entry] }));
},
setBodyLog: async (log) => {
  await storage.saveBodyLog(log);
  setState((prev) => ({ ...prev, bodyLog: log }));
},
```

- [ ] **Step 4: Run tests to make sure nothing broke**

```bash
npx jest --no-cache
```

Expected: All 61 existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/storage.ts src/context.tsx
git commit -m "feat(body): add BodyLog type, storage helpers, and context integration"
```

---

### Task 2: Muscle Constants + Exercise Mapping

**Files:**
- Create: `src/components/body/muscles.ts`

- [ ] **Step 1: Create the muscle constants and exercise mapping**

Create `src/components/body/muscles.ts`:

```typescript
export const MUSCLE_GROUPS = [
  "chest",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "back",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const FRONT_MUSCLES: MuscleGroup[] = [
  "chest",
  "shoulders",
  "biceps",
  "quads",
  "calves",
];

export const BACK_MUSCLES: MuscleGroup[] = [
  "back",
  "triceps",
  "forearms",
  "glutes",
  "hamstrings",
];

export const EXERCISE_MUSCLE_MAP: Record<string, Partial<Record<MuscleGroup, number>>> = {
  deadlift_4: { back: 0.4, glutes: 0.3, hamstrings: 0.2, forearms: 0.1 },
  squat_4: { quads: 0.4, glutes: 0.3, hamstrings: 0.2, calves: 0.1 },
  squat_8: { quads: 0.4, glutes: 0.3, hamstrings: 0.2, calves: 0.1 },
  bench_4: { chest: 0.5, shoulders: 0.3, triceps: 0.2 },
  bench_8: { chest: 0.5, shoulders: 0.3, triceps: 0.2 },
  ohp_4: { shoulders: 0.5, triceps: 0.3, chest: 0.2 },
  ohp_8: { shoulders: 0.5, triceps: 0.3, chest: 0.2 },
  chinups_4: { back: 0.5, biceps: 0.4, forearms: 0.1 },
  chinups_8: { back: 0.5, biceps: 0.4, forearms: 0.1 },
  bb_rows_4: { back: 0.4, biceps: 0.3, forearms: 0.2, shoulders: 0.1 },
  bb_rows_8: { back: 0.4, biceps: 0.3, forearms: 0.2, shoulders: 0.1 },
  incline_press_4: { chest: 0.4, shoulders: 0.4, triceps: 0.2 },
  incline_press_8: { chest: 0.4, shoulders: 0.4, triceps: 0.2 },
  curls_12: { biceps: 0.8, forearms: 0.2 },
  flies_12: { chest: 0.9, shoulders: 0.1 },
  tricep_ext_12: { triceps: 0.9, chest: 0.1 },
  calf_raise_12: { calves: 1.0 },
  rear_delt_fly_12: { shoulders: 0.6, back: 0.4 },
  lat_raise_12: { shoulders: 1.0 },
};

export const DECAY_HALF_LIFE_DAYS = 21;
export const MAX_WEEKLY_GAIN = 0.05;
export const MEMORY_MULTIPLIER = 2.0;
export const BF_DRIFT_PER_MONTH = 0.5;
export const INACTIVE_THRESHOLD_SESSIONS_PER_WEEK = 2;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/body/muscles.ts
git commit -m "feat(body): add muscle group constants and exercise-to-muscle mapping"
```

---

### Task 3: Body Model Computation Engine + Tests

**Files:**
- Create: `src/hooks/useBodyModel.ts`
- Create: `src/__tests__/useBodyModel.test.ts`

- [ ] **Step 1: Write the tests first**

Create `src/__tests__/useBodyModel.test.ts`:

```typescript
import { computeMuscleStates } from "../hooks/useBodyModel";
import { WorkoutLog, BodyLog } from "../types";

function makeWorkout(date: string, exercises: { key: string; sets: number }[]): WorkoutLog {
  return {
    id: date,
    date,
    day: 1,
    week: 1,
    cycle: 1,
    exercises: exercises.map((e) => ({
      name: e.key,
      key: e.key,
      reps: 4,
      type: "red" as const,
      sets: Array.from({ length: e.sets }, () => ({
        weight: 100,
        reps: 4,
        isAmrap: false,
        isPr: false,
      })),
    })),
    completedAt: date + "T12:00:00Z",
  };
}

describe("computeMuscleStates", () => {
  test("returns all zeroes with no history", () => {
    const result = computeMuscleStates([], [], new Date("2026-06-01"));
    expect(result.muscles.chest).toBe(0);
    expect(result.muscles.back).toBe(0);
    expect(result.monthsTrained).toBe(0);
  });

  test("training bench increases chest, shoulders, triceps", () => {
    const history = [
      makeWorkout("2026-05-01", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-05-03", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-05-05", [{ key: "bench_4", sets: 3 }]),
    ];
    const result = computeMuscleStates(history, [], new Date("2026-05-07"));
    expect(result.muscles.chest).toBeGreaterThan(0);
    expect(result.muscles.shoulders).toBeGreaterThan(0);
    expect(result.muscles.triceps).toBeGreaterThan(0);
    expect(result.muscles.quads).toBe(0);
  });

  test("muscles decay after 3 weeks of inactivity", () => {
    const history = [
      makeWorkout("2026-01-01", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-01-03", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-01-05", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-01-07", [{ key: "bench_4", sets: 3 }]),
    ];
    const afterTraining = computeMuscleStates(history, [], new Date("2026-01-08"));
    const after3Weeks = computeMuscleStates(history, [], new Date("2026-01-29"));
    expect(after3Weeks.muscles.chest).toBeLessThan(afterTraining.muscles.chest * 0.6);
  });

  test("muscle memory: regaining is faster", () => {
    const phase1 = Array.from({ length: 10 }, (_, i) =>
      makeWorkout(`2026-01-${String(i * 2 + 1).padStart(2, "0")}`, [{ key: "bench_4", sets: 3 }])
    );
    const peakState = computeMuscleStates(phase1, [], new Date("2026-01-21"));

    const afterDecay = computeMuscleStates(phase1, [], new Date("2026-03-01"));

    const regainPhase = [
      ...phase1,
      makeWorkout("2026-03-01", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-03-03", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-03-05", [{ key: "bench_4", sets: 3 }]),
    ];
    const afterRegain = computeMuscleStates(regainPhase, [], new Date("2026-03-06"));
    const gainFromRegain = afterRegain.muscles.chest - afterDecay.muscles.chest;

    const freshStart = [
      makeWorkout("2026-03-01", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-03-03", [{ key: "bench_4", sets: 3 }]),
      makeWorkout("2026-03-05", [{ key: "bench_4", sets: 3 }]),
    ];
    const freshGain = computeMuscleStates(freshStart, [], new Date("2026-03-06"));
    const gainFromFresh = freshGain.muscles.chest;

    expect(gainFromRegain).toBeGreaterThan(gainFromFresh);
  });

  test("body fat interpolates between logs", () => {
    const bodyLog: BodyLog[] = [
      { date: "2026-01-01", weight: 180, bodyFatPercent: 20 },
      { date: "2026-02-01", weight: 175, bodyFatPercent: 18 },
    ];
    const midpoint = computeMuscleStates([], bodyLog, new Date("2026-01-16"));
    expect(midpoint.bodyFatPercent).toBeCloseTo(19, 0);
    expect(midpoint.bodyWeight).toBeCloseTo(177.5, 0);
  });

  test("body fat drifts upward when inactive and no recent log", () => {
    const history = [
      makeWorkout("2026-01-01", [{ key: "bench_4", sets: 3 }]),
    ];
    const bodyLog: BodyLog[] = [
      { date: "2026-01-01", weight: 180, bodyFatPercent: 15 },
    ];
    const result = computeMuscleStates(history, bodyLog, new Date("2026-04-01"));
    expect(result.bodyFatPercent).toBeGreaterThan(15);
  });

  test("body fat does not drift when training is consistent", () => {
    const history = Array.from({ length: 36 }, (_, i) => {
      const day = (i % 28) + 1;
      const month = Math.floor(i / 28) + 1;
      return makeWorkout(
        `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        [{ key: "bench_4", sets: 3 }]
      );
    });
    const bodyLog: BodyLog[] = [
      { date: "2026-01-01", weight: 180, bodyFatPercent: 15 },
    ];
    const result = computeMuscleStates(history, bodyLog, new Date("2026-02-15"));
    expect(result.bodyFatPercent).toBe(15);
  });

  test("months trained counts from first workout to asOfDate", () => {
    const history = [
      makeWorkout("2026-01-15", [{ key: "bench_4", sets: 3 }]),
    ];
    const result = computeMuscleStates(history, [], new Date("2026-04-15"));
    expect(result.monthsTrained).toBe(3);
  });

  test("untrained muscles stay at zero", () => {
    const history = [
      makeWorkout("2026-05-01", [{ key: "curls_12", sets: 3 }]),
    ];
    const result = computeMuscleStates(history, [], new Date("2026-05-02"));
    expect(result.muscles.biceps).toBeGreaterThan(0);
    expect(result.muscles.chest).toBe(0);
    expect(result.muscles.quads).toBe(0);
  });

  test("values are clamped to [0, 1]", () => {
    const manyWorkouts = Array.from({ length: 200 }, (_, i) =>
      makeWorkout(`2026-01-${String((i % 28) + 1).padStart(2, "0")}`, [
        { key: "bench_4", sets: 10 },
        { key: "bench_8", sets: 10 },
        { key: "flies_12", sets: 10 },
      ])
    );
    const result = computeMuscleStates(manyWorkouts, [], new Date("2026-02-01"));
    expect(result.muscles.chest).toBeLessThanOrEqual(1);
    expect(result.muscles.chest).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/useBodyModel.test.ts --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the computation engine**

Create `src/hooks/useBodyModel.ts`:

```typescript
import { WorkoutLog, BodyLog, BodyModelState } from "../types";
import {
  MUSCLE_GROUPS,
  MuscleGroup,
  EXERCISE_MUSCLE_MAP,
  DECAY_HALF_LIFE_DAYS,
  MAX_WEEKLY_GAIN,
  MEMORY_MULTIPLIER,
  BF_DRIFT_PER_MONTH,
  INACTIVE_THRESHOLD_SESSIONS_PER_WEEK,
} from "../components/body/muscles";

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function applyDecay(currentSize: number, daysSinceTraining: number): number {
  if (daysSinceTraining <= 0) return currentSize;
  return currentSize * Math.pow(0.5, daysSinceTraining / DECAY_HALF_LIFE_DAYS);
}

function computeWeeklyGain(rawSets: number): number {
  let gain = 0;
  if (rawSets <= 10) {
    gain = rawSets * 0.01;
  } else if (rawSets <= 20) {
    gain = 10 * 0.01 + (rawSets - 10) * 0.005;
  } else {
    gain = 10 * 0.01 + 10 * 0.005 + (rawSets - 20) * 0.001;
  }
  return Math.min(gain, MAX_WEEKLY_GAIN);
}

function interpolateBodyFat(
  bodyLog: BodyLog[],
  asOfDate: Date,
  weeklySessionCounts: Map<string, number>
): { bodyFatPercent: number; bodyWeight: number } {
  if (bodyLog.length === 0) return { bodyFatPercent: 18, bodyWeight: 0 };

  const sorted = [...bodyLog].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const asOfTime = asOfDate.getTime();

  if (sorted.length === 1) {
    const entry = sorted[0];
    const entryDate = new Date(entry.date);
    const daysSince = daysBetween(entryDate, asOfDate);

    if (asOfTime < entryDate.getTime()) {
      return { bodyFatPercent: entry.bodyFatPercent, bodyWeight: entry.weight };
    }

    if (daysSince <= 28) {
      return { bodyFatPercent: entry.bodyFatPercent, bodyWeight: entry.weight };
    }

    const recentWeeks = getRecentWeekSessionCount(weeklySessionCounts, asOfDate, 4);
    const avgSessionsPerWeek = recentWeeks > 0 ? recentWeeks / 4 : 0;

    if (avgSessionsPerWeek >= INACTIVE_THRESHOLD_SESSIONS_PER_WEEK) {
      return { bodyFatPercent: entry.bodyFatPercent, bodyWeight: entry.weight };
    }

    const monthsInactive = (daysSince - 28) / 30;
    const maxBf = entry.bodyFatPercent;
    const driftedBf = Math.min(
      entry.bodyFatPercent + monthsInactive * BF_DRIFT_PER_MONTH,
      maxBf + 10
    );

    return { bodyFatPercent: driftedBf, bodyWeight: entry.weight };
  }

  const last = sorted[sorted.length - 1];
  const lastDate = new Date(last.date);

  if (asOfTime >= lastDate.getTime()) {
    const daysSinceLast = daysBetween(lastDate, asOfDate);

    if (daysSinceLast <= 28) {
      return { bodyFatPercent: last.bodyFatPercent, bodyWeight: last.weight };
    }

    const recentWeeks = getRecentWeekSessionCount(weeklySessionCounts, asOfDate, 4);
    const avgSessionsPerWeek = recentWeeks > 0 ? recentWeeks / 4 : 0;

    if (avgSessionsPerWeek >= INACTIVE_THRESHOLD_SESSIONS_PER_WEEK) {
      return { bodyFatPercent: last.bodyFatPercent, bodyWeight: last.weight };
    }

    const maxBf = Math.max(...sorted.map((e) => e.bodyFatPercent));
    const monthsInactive = (daysSinceLast - 28) / 30;
    const driftedBf = Math.min(
      last.bodyFatPercent + monthsInactive * BF_DRIFT_PER_MONTH,
      maxBf
    );

    return { bodyFatPercent: driftedBf, bodyWeight: last.weight };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    if (asOfTime >= aTime && asOfTime <= bTime) {
      const t = (asOfTime - aTime) / (bTime - aTime);
      return {
        bodyFatPercent: a.bodyFatPercent + (b.bodyFatPercent - a.bodyFatPercent) * t,
        bodyWeight: a.weight + (b.weight - a.weight) * t,
      };
    }
  }

  return { bodyFatPercent: sorted[0].bodyFatPercent, bodyWeight: sorted[0].weight };
}

function getRecentWeekSessionCount(
  weeklySessionCounts: Map<string, number>,
  asOfDate: Date,
  numWeeks: number
): number {
  let total = 0;
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(asOfDate);
    d.setDate(d.getDate() - i * 7);
    const key = getWeekKey(d);
    total += weeklySessionCounts.get(key) ?? 0;
  }
  return total;
}

export function computeMuscleStates(
  history: WorkoutLog[],
  bodyLog: BodyLog[],
  asOfDate: Date
): BodyModelState {
  const muscles: Record<string, number> = {};
  const peakMuscles: Record<string, number> = {};
  const lastTrained: Record<string, Date> = {};

  for (const m of MUSCLE_GROUPS) {
    muscles[m] = 0;
    peakMuscles[m] = 0;
  }

  const sorted = [...history]
    .filter((w) => w.completedAt && new Date(w.date) <= asOfDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length === 0) {
    const bf = interpolateBodyFat(bodyLog, asOfDate, new Map());
    return {
      muscles,
      bodyFatPercent: bf.bodyFatPercent,
      bodyWeight: bf.bodyWeight,
      monthsTrained: 0,
      peakMuscles,
    };
  }

  const weeklyVolume: Record<string, Record<string, number>> = {};
  const weeklySessionCounts = new Map<string, number>();

  for (const workout of sorted) {
    const wDate = new Date(workout.date);
    const weekKey = getWeekKey(wDate);

    weeklySessionCounts.set(weekKey, (weeklySessionCounts.get(weekKey) ?? 0) + 1);

    if (!weeklyVolume[weekKey]) {
      weeklyVolume[weekKey] = {};
      for (const m of MUSCLE_GROUPS) weeklyVolume[weekKey][m] = 0;
    }

    for (const exercise of workout.exercises) {
      const mapping = EXERCISE_MUSCLE_MAP[exercise.key];
      if (!mapping) continue;
      const setCount = exercise.sets.length;

      for (const [muscle, weight] of Object.entries(mapping)) {
        weeklyVolume[weekKey][muscle] += setCount * weight;
        lastTrained[muscle] = wDate;
      }
    }
  }

  const weekKeys = Object.keys(weeklyVolume).sort();

  for (let i = 0; i < weekKeys.length; i++) {
    const currentWeekKey = weekKeys[i];
    const currentWeekDate = new Date(currentWeekKey);

    if (i > 0) {
      const prevWeekDate = new Date(weekKeys[i - 1]);
      const gapDays = daysBetween(prevWeekDate, currentWeekDate);

      if (gapDays > 7) {
        for (const m of MUSCLE_GROUPS) {
          muscles[m] = applyDecay(muscles[m], gapDays - 7);
        }
      }
    }

    const vol = weeklyVolume[currentWeekKey];
    for (const m of MUSCLE_GROUPS) {
      if (vol[m] > 0) {
        let gain = computeWeeklyGain(vol[m]);
        if (muscles[m] < peakMuscles[m]) {
          gain *= MEMORY_MULTIPLIER;
        }
        muscles[m] = Math.min(1, muscles[m] + gain);
        if (muscles[m] > peakMuscles[m]) {
          peakMuscles[m] = muscles[m];
        }
      }
    }
  }

  const lastWeekDate = new Date(weekKeys[weekKeys.length - 1]);
  const daysSinceLastWeek = daysBetween(lastWeekDate, asOfDate);
  if (daysSinceLastWeek > 7) {
    for (const m of MUSCLE_GROUPS) {
      muscles[m] = applyDecay(muscles[m], daysSinceLastWeek - 7);
    }
  }

  for (const m of MUSCLE_GROUPS) {
    muscles[m] = Math.max(0, Math.min(1, muscles[m]));
  }

  const firstWorkoutDate = new Date(sorted[0].date);
  const monthsTrained = Math.floor(daysBetween(firstWorkoutDate, asOfDate) / 30);

  const bf = interpolateBodyFat(bodyLog, asOfDate, weeklySessionCounts);

  return {
    muscles,
    bodyFatPercent: bf.bodyFatPercent,
    bodyWeight: bf.bodyWeight,
    monthsTrained,
    peakMuscles,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/useBodyModel.test.ts --no-cache
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-cache
```

Expected: All tests pass (61 existing + 9 new = 70).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useBodyModel.ts src/__tests__/useBodyModel.test.ts
git commit -m "feat(body): add muscle computation engine with decay, memory, and BF interpolation"
```

---

### Task 4: SVG Body Figure — Path Data

**Files:**
- Create: `src/components/body/paths.ts`

This is the SVG control point data that defines the body shape. It must be separated from the rendering component to keep file sizes manageable.

- [ ] **Step 1: Create the path data file**

Create `src/components/body/paths.ts`:

This file defines bezier control points for the front and back views of a human body. Each body region has `base` (untrained) and `trained` (fully developed) variants. Points are defined in a 200×400 coordinate space (width×height).

```typescript
export interface BodyPoint {
  x: number;
  y: number;
}

export interface BodyRegion {
  id: string;
  muscle: string;
  base: string;
  trained: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPath(basePath: string, trainedPath: string, t: number): string {
  const baseNums = basePath.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
  const trainedNums = trainedPath.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
  if (baseNums.length !== trainedNums.length) return basePath;

  let idx = 0;
  return basePath.replace(/-?\d+\.?\d*/g, () => {
    const result = lerp(baseNums[idx], trainedNums[idx], t);
    idx++;
    return result.toFixed(1);
  });
}

// Coordinate space: 200 wide × 400 tall
// Center line at x=100
// Top of head at y=10, feet at y=390

// --- FRONT VIEW REGIONS ---

export const FRONT_REGIONS: BodyRegion[] = [
  // Head (static — does not morph)
  {
    id: "head",
    muscle: "",
    base: "M 85 30 C 85 15, 115 15, 115 30 C 115 45, 108 55, 100 58 C 92 55, 85 45, 85 30 Z",
    trained: "M 85 30 C 85 15, 115 15, 115 30 C 115 45, 108 55, 100 58 C 92 55, 85 45, 85 30 Z",
  },
  // Neck (static)
  {
    id: "neck",
    muscle: "",
    base: "M 93 55 L 93 65 L 107 65 L 107 55",
    trained: "M 93 55 L 93 65 L 107 65 L 107 55",
  },
  // Left shoulder/deltoid
  {
    id: "shoulder-l",
    muscle: "shoulders",
    base: "M 93 65 C 80 65, 68 72, 65 85 L 72 88 C 74 78, 82 70, 93 70 Z",
    trained: "M 93 65 C 75 63, 60 70, 56 85 L 65 90 C 67 77, 78 68, 93 68 Z",
  },
  // Right shoulder/deltoid
  {
    id: "shoulder-r",
    muscle: "shoulders",
    base: "M 107 65 C 120 65, 132 72, 135 85 L 128 88 C 126 78, 118 70, 107 70 Z",
    trained: "M 107 65 C 125 63, 140 70, 144 85 L 135 90 C 133 77, 122 68, 107 68 Z",
  },
  // Left chest/pec
  {
    id: "chest-l",
    muscle: "chest",
    base: "M 93 70 C 82 70, 74 78, 72 88 L 72 105 C 80 108, 90 105, 97 100 L 97 70 Z",
    trained: "M 93 68 C 78 68, 67 77, 65 90 L 64 108 C 76 114, 90 110, 97 102 L 97 68 Z",
  },
  // Right chest/pec
  {
    id: "chest-r",
    muscle: "chest",
    base: "M 107 70 C 118 70, 126 78, 128 88 L 128 105 C 120 108, 110 105, 103 100 L 103 70 Z",
    trained: "M 107 68 C 122 68, 133 77, 135 90 L 136 108 C 124 114, 110 110, 103 102 L 103 68 Z",
  },
  // Left bicep
  {
    id: "bicep-l",
    muscle: "biceps",
    base: "M 65 85 C 62 95, 60 110, 62 125 L 68 125 C 70 112, 70 98, 72 88 Z",
    trained: "M 56 85 C 52 95, 48 110, 51 125 L 60 125 C 64 112, 66 98, 65 90 Z",
  },
  // Right bicep
  {
    id: "bicep-r",
    muscle: "biceps",
    base: "M 135 85 C 138 95, 140 110, 138 125 L 132 125 C 130 112, 130 98, 128 88 Z",
    trained: "M 144 85 C 148 95, 152 110, 149 125 L 140 125 C 136 112, 134 98, 135 90 Z",
  },
  // Left forearm
  {
    id: "forearm-l",
    muscle: "forearms",
    base: "M 62 125 C 60 145, 62 165, 65 180 L 70 180 C 72 165, 70 145, 68 125 Z",
    trained: "M 51 125 C 48 145, 52 165, 56 180 L 64 180 C 68 165, 65 145, 60 125 Z",
  },
  // Right forearm
  {
    id: "forearm-r",
    muscle: "forearms",
    base: "M 138 125 C 140 145, 138 165, 135 180 L 130 180 C 128 165, 130 145, 132 125 Z",
    trained: "M 149 125 C 152 145, 148 165, 144 180 L 136 180 C 132 165, 135 145, 140 125 Z",
  },
  // Abs/core area
  {
    id: "core",
    muscle: "core",
    base: "M 80 105 L 80 180 C 85 185, 95 185, 100 185 C 105 185, 115 185, 120 180 L 120 105 C 110 108, 90 108, 80 105 Z",
    trained: "M 76 108 L 76 175 C 82 180, 92 180, 100 180 C 108 180, 118 180, 124 175 L 124 108 C 114 114, 86 114, 76 108 Z",
  },
  // Left quad
  {
    id: "quad-l",
    muscle: "quads",
    base: "M 80 185 C 78 210, 76 240, 78 270 L 72 270 C 70 300, 75 310, 78 310 L 95 310 C 98 310, 100 300, 98 270 L 100 185 Z",
    trained: "M 76 180 C 72 210, 68 240, 70 270 L 65 270 C 62 300, 68 310, 72 310 L 95 310 C 100 310, 102 300, 100 270 L 100 180 Z",
  },
  // Right quad
  {
    id: "quad-r",
    muscle: "quads",
    base: "M 120 185 C 122 210, 124 240, 122 270 L 128 270 C 130 300, 125 310, 122 310 L 105 310 C 102 310, 100 300, 102 270 L 100 185 Z",
    trained: "M 124 180 C 128 210, 132 240, 130 270 L 135 270 C 138 300, 132 310, 128 310 L 105 310 C 100 310, 98 300, 100 270 L 100 180 Z",
  },
  // Left calf
  {
    id: "calf-l",
    muscle: "calves",
    base: "M 78 310 C 76 330, 74 350, 77 370 L 77 390 L 93 390 L 93 370 C 95 350, 95 330, 95 310 Z",
    trained: "M 72 310 C 68 330, 66 350, 72 370 L 72 390 L 93 390 L 93 370 C 98 350, 98 330, 95 310 Z",
  },
  // Right calf
  {
    id: "calf-r",
    muscle: "calves",
    base: "M 122 310 C 124 330, 126 350, 123 370 L 123 390 L 107 390 L 107 370 C 105 350, 105 330, 105 310 Z",
    trained: "M 128 310 C 132 330, 134 350, 128 370 L 128 390 L 107 390 L 107 370 C 102 350, 102 330, 105 310 Z",
  },
];

// --- BACK VIEW REGIONS ---

export const BACK_REGIONS: BodyRegion[] = [
  // Head (static)
  {
    id: "head-back",
    muscle: "",
    base: "M 85 30 C 85 15, 115 15, 115 30 C 115 45, 108 55, 100 58 C 92 55, 85 45, 85 30 Z",
    trained: "M 85 30 C 85 15, 115 15, 115 30 C 115 45, 108 55, 100 58 C 92 55, 85 45, 85 30 Z",
  },
  // Neck (static)
  {
    id: "neck-back",
    muscle: "",
    base: "M 93 55 L 93 65 L 107 65 L 107 55",
    trained: "M 93 55 L 93 65 L 107 65 L 107 55",
  },
  // Left rear delt
  {
    id: "rear-delt-l",
    muscle: "shoulders",
    base: "M 93 65 C 80 65, 68 72, 65 85 L 72 88 C 74 78, 82 70, 93 70 Z",
    trained: "M 93 65 C 75 63, 60 70, 56 85 L 65 90 C 67 77, 78 68, 93 68 Z",
  },
  // Right rear delt
  {
    id: "rear-delt-r",
    muscle: "shoulders",
    base: "M 107 65 C 120 65, 132 72, 135 85 L 128 88 C 126 78, 118 70, 107 70 Z",
    trained: "M 107 65 C 125 63, 140 70, 144 85 L 135 90 C 133 77, 122 68, 107 68 Z",
  },
  // Left upper back / lat
  {
    id: "back-l",
    muscle: "back",
    base: "M 93 70 C 82 70, 74 78, 72 88 L 72 115 C 78 118, 90 115, 97 110 L 97 70 Z",
    trained: "M 93 68 C 76 68, 64 77, 60 90 L 58 120 C 70 126, 88 120, 97 112 L 97 68 Z",
  },
  // Right upper back / lat
  {
    id: "back-r",
    muscle: "back",
    base: "M 107 70 C 118 70, 126 78, 128 88 L 128 115 C 122 118, 110 115, 103 110 L 103 70 Z",
    trained: "M 107 68 C 124 68, 136 77, 140 90 L 142 120 C 130 126, 112 120, 103 112 L 103 68 Z",
  },
  // Left tricep
  {
    id: "tricep-l",
    muscle: "triceps",
    base: "M 65 85 C 62 95, 60 110, 62 125 L 68 125 C 70 112, 70 98, 72 88 Z",
    trained: "M 56 85 C 52 95, 48 110, 51 125 L 60 125 C 64 112, 66 98, 65 90 Z",
  },
  // Right tricep
  {
    id: "tricep-r",
    muscle: "triceps",
    base: "M 135 85 C 138 95, 140 110, 138 125 L 132 125 C 130 112, 130 98, 128 88 Z",
    trained: "M 144 85 C 148 95, 152 110, 149 125 L 140 125 C 136 112, 134 98, 135 90 Z",
  },
  // Left forearm (back)
  {
    id: "forearm-back-l",
    muscle: "forearms",
    base: "M 62 125 C 60 145, 62 165, 65 180 L 70 180 C 72 165, 70 145, 68 125 Z",
    trained: "M 51 125 C 48 145, 52 165, 56 180 L 64 180 C 68 165, 65 145, 60 125 Z",
  },
  // Right forearm (back)
  {
    id: "forearm-back-r",
    muscle: "forearms",
    base: "M 138 125 C 140 145, 138 165, 135 180 L 130 180 C 128 165, 130 145, 132 125 Z",
    trained: "M 149 125 C 152 145, 148 165, 144 180 L 136 180 C 132 165, 135 145, 140 125 Z",
  },
  // Lower back / glutes
  {
    id: "glutes",
    muscle: "glutes",
    base: "M 80 115 L 80 195 C 90 200, 110 200, 120 195 L 120 115 C 110 118, 90 118, 80 115 Z",
    trained: "M 76 120 L 74 200 C 86 208, 114 208, 126 200 L 124 120 C 114 126, 86 126, 76 120 Z",
  },
  // Left hamstring
  {
    id: "hamstring-l",
    muscle: "hamstrings",
    base: "M 80 195 C 78 220, 76 250, 78 280 L 95 280 C 97 250, 98 220, 100 195 Z",
    trained: "M 74 200 C 70 225, 66 255, 70 285 L 95 285 C 98 255, 100 225, 100 200 Z",
  },
  // Right hamstring
  {
    id: "hamstring-r",
    muscle: "hamstrings",
    base: "M 120 195 C 122 220, 124 250, 122 280 L 105 280 C 103 250, 102 220, 100 195 Z",
    trained: "M 126 200 C 130 225, 134 255, 130 285 L 105 285 C 102 255, 100 225, 100 200 Z",
  },
  // Left calf (back)
  {
    id: "calf-back-l",
    muscle: "calves",
    base: "M 78 280 C 76 310, 74 340, 77 370 L 77 390 L 93 390 L 93 370 C 95 340, 95 310, 95 280 Z",
    trained: "M 70 285 C 66 315, 64 345, 70 370 L 70 390 L 93 390 L 93 370 C 98 345, 100 315, 95 285 Z",
  },
  // Right calf (back)
  {
    id: "calf-back-r",
    muscle: "calves",
    base: "M 122 280 C 124 310, 126 340, 123 370 L 123 390 L 107 390 L 107 370 C 105 340, 105 310, 105 280 Z",
    trained: "M 130 285 C 134 315, 136 345, 130 370 L 130 390 L 107 390 L 107 370 C 102 345, 100 315, 105 285 Z",
  },
];

// Muscle separation lines — visible only at low BF%
export const SEPARATION_LINES = {
  front: {
    pecLine: "M 97 75 L 97 100",
    centerLine: "M 100 70 L 100 185",
    abLines: [
      "M 88 115 L 112 115",
      "M 87 130 L 113 130",
      "M 86 145 L 114 145",
      "M 85 160 L 115 160",
    ],
    quadSep: ["M 88 200 C 86 240, 85 270, 86 310", "M 112 200 C 114 240, 115 270, 114 310"],
  },
  back: {
    spineLine: "M 100 65 L 100 195",
    latLine: ["M 85 80 C 78 100, 80 115, 85 120", "M 115 80 C 122 100, 120 115, 115 120"],
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/body/paths.ts
git commit -m "feat(body): add SVG bezier path data for front and back body views"
```

---

### Task 5: SVG Body Figure Component

**Files:**
- Create: `src/components/BodyFigure.tsx`

- [ ] **Step 1: Create the BodyFigure component**

Create `src/components/BodyFigure.tsx`:

```tsx
import React, { useState } from "react";
import { View, StyleSheet, TouchableWithoutFeedback, Text } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { colors, typography, spacing } from "../theme";
import {
  FRONT_REGIONS,
  BACK_REGIONS,
  SEPARATION_LINES,
  lerpPath,
} from "./body/paths";

interface BodyFigureProps {
  muscles: Record<string, number>;
  bodyFatPercent: number;
  highlightedMuscles: string[];
  side: "front" | "back";
  onToggleSide: () => void;
  width: number;
  height: number;
}

const VIEWBOX_W = 200;
const VIEWBOX_H = 400;

function getMuscleColor(
  muscle: string,
  effectiveSize: number,
  isHighlighted: boolean
): string {
  if (isHighlighted) {
    const alpha = 0.3 + effectiveSize * 0.4;
    return `rgba(232, 168, 56, ${alpha})`;
  }

  const base = { r: 22, g: 22, b: 26 };
  const full = { r: 60, g: 55, b: 45 };
  const t = effectiveSize;
  const r = Math.round(base.r + (full.r - base.r) * t);
  const g = Math.round(base.g + (full.g - base.g) * t);
  const b = Math.round(base.b + (full.b - base.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getStrokeColor(effectiveSize: number): string {
  const alpha = 0.05 + effectiveSize * 0.15;
  return `rgba(242, 240, 235, ${alpha})`;
}

export function BodyFigure({
  muscles,
  bodyFatPercent,
  highlightedMuscles,
  side,
  onToggleSide,
  width,
  height,
}: BodyFigureProps) {
  const [tooltip, setTooltip] = useState<{ muscle: string; value: number } | null>(null);

  const regions = side === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const sepLines = side === "front" ? SEPARATION_LINES.front : SEPARATION_LINES.back;
  const separationOpacity = Math.max(0, Math.min(1, (20 - bodyFatPercent) / 8));

  const waistScale = 1.0 + (bodyFatPercent - 12) * 0.008;

  return (
    <TouchableWithoutFeedback onPress={onToggleSide}>
      <View style={[styles.container, { width, height }]}>
        <Svg
          width={width}
          height={height}
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <G>
            {regions.map((region) => {
              const muscleKey = region.muscle;
              const effectiveSize = muscleKey
                ? muscles[muscleKey] ?? 0
                : 0;
              const isHighlighted = muscleKey
                ? highlightedMuscles.includes(muscleKey)
                : false;

              let t = effectiveSize;
              if (region.id === "core") {
                t = Math.max(0, 1 - waistScale + effectiveSize * 0.3);
              }

              const d = lerpPath(region.base, region.trained, t);
              const fill = muscleKey
                ? getMuscleColor(muscleKey, effectiveSize, isHighlighted)
                : colors.surface;
              const stroke = muscleKey
                ? getStrokeColor(effectiveSize)
                : "rgba(242, 240, 235, 0.05)";

              return (
                <Path
                  key={region.id}
                  d={d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={0.5}
                  onPressIn={() => {
                    if (muscleKey) {
                      setTooltip({ muscle: muscleKey, value: Math.round(effectiveSize * 100) });
                    }
                  }}
                  onPressOut={() => setTooltip(null)}
                />
              );
            })}

            {/* Separation lines — visible at low BF */}
            {side === "front" && (
              <>
                <Path
                  d={sepLines.pecLine}
                  stroke={`rgba(242, 240, 235, ${separationOpacity * 0.3})`}
                  strokeWidth={0.5}
                  fill="none"
                />
                <Path
                  d={sepLines.centerLine}
                  stroke={`rgba(242, 240, 235, ${separationOpacity * 0.2})`}
                  strokeWidth={0.3}
                  fill="none"
                />
                {sepLines.abLines.map((line, i) => (
                  <Path
                    key={`ab-${i}`}
                    d={line}
                    stroke={`rgba(242, 240, 235, ${separationOpacity * 0.25})`}
                    strokeWidth={0.4}
                    fill="none"
                  />
                ))}
                {sepLines.quadSep.map((line, i) => (
                  <Path
                    key={`quad-sep-${i}`}
                    d={line}
                    stroke={`rgba(242, 240, 235, ${separationOpacity * 0.2})`}
                    strokeWidth={0.3}
                    fill="none"
                  />
                ))}
              </>
            )}
            {side === "back" && (
              <>
                <Path
                  d={sepLines.spineLine}
                  stroke={`rgba(242, 240, 235, ${separationOpacity * 0.2})`}
                  strokeWidth={0.3}
                  fill="none"
                />
                {sepLines.latLine.map((line, i) => (
                  <Path
                    key={`lat-${i}`}
                    d={line}
                    stroke={`rgba(242, 240, 235, ${separationOpacity * 0.25})`}
                    strokeWidth={0.4}
                    fill="none"
                  />
                ))}
              </>
            )}
          </G>
        </Svg>

        {/* Tooltip */}
        {tooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipMuscle}>
              {tooltip.muscle.charAt(0).toUpperCase() + tooltip.muscle.slice(1)}
            </Text>
            <Text style={styles.tooltipValue}>{tooltip.value}%</Text>
          </View>
        )}

        {/* Side indicator */}
        <Text style={styles.sideLabel}>
          {side === "front" ? "FRONT" : "BACK"}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tooltipMuscle: {
    color: colors.text,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
  },
  tooltipValue: {
    color: colors.accent,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 20,
  },
  sideLabel: {
    position: "absolute",
    bottom: 4,
    alignSelf: "center",
    color: colors.textTertiary,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 9,
    letterSpacing: 2,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BodyFigure.tsx
git commit -m "feat(body): add SVG body figure component with morphing and muscle highlighting"
```

---

### Task 6: Body Screen + Tab

**Files:**
- Create: `app/(tabs)/body.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create the Body screen**

Create `app/(tabs)/body.tsx`:

```tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "../../src/context";
import { computeMuscleStates } from "../../src/hooks/useBodyModel";
import { BodyFigure } from "../../src/components/BodyFigure";
import { MUSCLE_GROUPS } from "../../src/components/body/muscles";
import { colors, typography, spacing, fonts } from "../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const { history, bodyLog } = useAppContext();
  const [side, setSide] = useState<"front" | "back">("front");
  const [sliderValue, setSliderValue] = useState(1);

  const firstWorkoutDate = useMemo(() => {
    if (history.length === 0) return new Date();
    const sorted = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return new Date(sorted[0].date);
  }, [history]);

  const today = new Date();
  const totalDays = Math.max(1, Math.floor(
    (today.getTime() - firstWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
  ));

  const asOfDate = useMemo(() => {
    const d = new Date(firstWorkoutDate);
    d.setDate(d.getDate() + Math.floor(sliderValue * totalDays));
    return d;
  }, [sliderValue, firstWorkoutDate, totalDays]);

  const modelState = useMemo(
    () => computeMuscleStates(history, bodyLog, asOfDate),
    [history, bodyLog, asOfDate]
  );

  const thisWeekMuscles = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentWorkouts = history.filter((w) => {
      const d = new Date(w.date);
      return d >= weekAgo && d <= now;
    });
    const trained = new Set<string>();
    for (const w of recentWorkouts) {
      for (const ex of w.exercises) {
        const mapping = require("../../src/components/body/muscles").EXERCISE_MUSCLE_MAP;
        const m = mapping[ex.key];
        if (m) Object.keys(m).forEach((k) => trained.add(k));
      }
    }
    return Array.from(trained);
  }, [history]);

  const figureWidth = SCREEN_WIDTH - 40;
  const figureHeight = figureWidth * 1.8;

  const dateLabel = asOfDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const hasHistory = history.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.screenLabel}>THE MIRROR</Text>

      {!hasHistory && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Complete your first workout to start tracking
          </Text>
        </View>
      )}

      <View style={styles.figureContainer}>
        <BodyFigure
          muscles={modelState.muscles}
          bodyFatPercent={modelState.bodyFatPercent}
          highlightedMuscles={sliderValue >= 0.95 ? thisWeekMuscles : []}
          side={side}
          onToggleSide={() => setSide((s) => (s === "front" ? "back" : "front"))}
          width={figureWidth}
          height={figureHeight}
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {modelState.bodyWeight > 0 ? Math.round(modelState.bodyWeight) : "—"}
          </Text>
          <Text style={styles.statLabel}>WEIGHT</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {modelState.bodyFatPercent > 0
              ? `${modelState.bodyFatPercent.toFixed(1)}%`
              : "—"}
          </Text>
          <Text style={styles.statLabel}>BODY FAT</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{modelState.monthsTrained}</Text>
          <Text style={styles.statLabel}>MONTHS</Text>
        </View>
      </View>

      {/* Timeline slider */}
      {hasHistory && (
        <View style={styles.sliderContainer}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={sliderValue}
            onValueChange={setSliderValue}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.surfaceTertiary}
            thumbTintColor={colors.accent}
          />
        </View>
      )}

      {bodyLog.length === 0 && hasHistory && (
        <Text style={styles.logPrompt}>
          Log body measurements in Settings for accurate tracking
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
  },
  screenLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: "center",
  },
  figureContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    maxHeight: "55%",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: colors.text,
    ...typography.displayMedium,
  },
  statLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    marginTop: 2,
  },
  sliderContainer: {
    width: "100%",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  dateLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  logPrompt: {
    color: colors.textTertiary,
    ...typography.micro,
    textAlign: "center",
    paddingBottom: spacing.md,
  },
});
```

**Note:** This uses `@react-native-community/slider`. Install it first:

```bash
npx expo install @react-native-community/slider
```

If that package doesn't exist in Expo, use React Native's built-in Slider or a simple custom slider using PanGestureHandler. As a fallback, use a simple `View` + `PanResponder`.

- [ ] **Step 2: Add Body tab to layout**

In `app/(tabs)/_layout.tsx`, add between the History and Settings `Tabs.Screen` entries:

```tsx
<Tabs.Screen
  name="body"
  options={{
    title: "Body",
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="body-outline" size={size} color={color} />
    ),
  }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/body.tsx app/\(tabs\)/_layout.tsx
git commit -m "feat(body): add Body screen with timeline slider and tab navigation"
```

---

### Task 7: Body Measurements in Settings

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Add Body Measurements section**

In `app/(tabs)/settings.tsx`, add a new section before the Data section. This section includes:

- Section header "BODY MEASUREMENTS" in caption style
- "Log Measurement" button that opens a modal with:
  - Body weight numeric input (pre-filled with last entry's value or empty)
  - Body fat % numeric input (pre-filled with last entry's value or empty)
  - Save and Cancel buttons
- Below the button: list of past body log entries showing date, weight, BF%
- Each entry deletable via long-press with Alert confirmation

Read `bodyLog` and `addBodyLog` / `setBodyLog` from `useAppContext()`.

The modal follows the existing edit modal pattern in the settings file.

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/settings.tsx
git commit -m "feat(body): add body measurement logging in settings"
```

---

### Task 8: Verification

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-cache
```

Expected: All tests pass (61 existing + 9 new body model tests = 70).

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Verify on device**

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=172.19.0.194 npx expo start --lan
```

Check:
- Body tab appears between History and Settings
- Empty state shows when no history
- After logging a workout, the figure shows muscle activation
- Timeline slider morphs the figure
- Tapping figure flips front/back
- Long press shows muscle tooltip
- Settings → Body Measurements → can log weight + BF%
- Body screen reflects logged BF% in stats

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(body): address issues found during device testing"
```
