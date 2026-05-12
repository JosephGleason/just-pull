# Lvysaur's Intermediate Aesthetic Routine — Mobile Tracker

Personal fitness tracker for Lvysaur's 5-day Intermediate Aesthetic Routine. Built with React Native + Expo. Guided workout logging with auto-progression, rest timers, progress charts, and a caloric/macro calculator.

## Target User

Single user (the developer). No auth, no backend, no app store deployment. All data stored locally on device.

## Tech Stack

- Expo SDK 52+ with Expo Router (file-based routing)
- AsyncStorage for all persistent data
- react-native-chart-kit or victory-native for progress charts
- expo-haptics for set completion feedback
- expo-notifications for rest timer alerts when backgrounded

## Program Definition (Hardcoded)

### Schedule

5 training days per week: Days 1, 2, 3, 5, 6. Days 4 and 7 are rest days.

### Exercises Per Day

Exercises are color-coded in the original spreadsheet. Colors determine behavior:

- **Red (compound, strict reps):** Bench, OHP, Chinups, BB Rows, Incline Press
- **Blue (heavy compound, steeper taper):** Deadlift, Squat
- **Black (AMRAP every set, drop weight as needed):** Curls, Flies, Tricep Ext, Calf Raise, Rear Delt Fly, Lat Raise

#### Day 1

| Exercise | Reps | Type | W1 Sets | W2 Sets | W3 Sets |
|----------|------|------|---------|---------|---------|
| Deadlift | 4 | Blue | 2 | 1 | 0 |
| Chinups | 8 | Red | 3 | 2 | 1 |
| BB Rows | 4 | Red | 3 | 2 | 1 |
| Curls | 12 | Black | 3 | 2 | 1 |

#### Day 2

| Exercise | Reps | Type | W1 Sets | W2 Sets | W3 Sets |
|----------|------|------|---------|---------|---------|
| Bench | 4 | Red | 3 | 2 | 1 |
| Incline Press | 8 | Red | 3 | 2 | 1 |
| Flies | 12 | Black | 3 | 2 | 1 |
| Tricep Ext | 12 | Black | 3 | 2 | 1 |

#### Day 3

| Exercise | Reps | Type | W1 Sets | W2 Sets | W3 Sets |
|----------|------|------|---------|---------|---------|
| Squat | 4 | Blue | 2 | 1 | 0 |
| OHP | 8 | Red | 3 | 2 | 1 |
| Calf Raise | 12 | Black | 3 | 2 | 1 |
| Rear Delt Fly | 12 | Black | 3 | 2 | 1 |
| Lat Raise | 12 | Black | 3 | 2 | 1 |

#### Day 5

| Exercise | Reps | Type | W1 Sets | W2 Sets | W3 Sets |
|----------|------|------|---------|---------|---------|
| Chinups | 4 | Red | 3 | 2 | 1 |
| Bench | 8 | Red | 3 | 2 | 1 |
| BB Rows | 8 | Red | 3 | 2 | 1 |
| Incline Press | 4 | Red | 3 | 2 | 1 |

#### Day 6

| Exercise | Reps | Type | W1 Sets | W2 Sets | W3 Sets |
|----------|------|------|---------|---------|---------|
| Squat | 8 | Blue | 2 | 1 | 0 |
| OHP | 4 | Red | 3 | 2 | 1 |
| Calf Raise | 12 | Black | 3 | 2 | 1 |
| Curls | 12 | Black | 3 | 2 | 1 |

### Volume Taper Patterns

- Standard (Red + Black): 3 → 2 → 1 sets across Weeks 1, 2, 3
- Heavy compound (Blue — Squat, Deadlift): 2 → 1 → 0 sets across Weeks 1, 2, 3

### Progression Rules (Verified From Spreadsheet)

Verbatim from the spreadsheet footer:

1. "On Week 1, Add 5lb or 10lb"
2. "If success, add it to Week 2"
3. "Iff success, add it to Week 3"
4. "If success, it's your new working weight."

Additional rules from the original Reddit post:

- Progress on each exercise individually. If you fail an increase for 8-rep squats but succeed for 4-rep squats, progress for your 4-rep squats.
- First cycle: run through without attempting a PR. Establishes baseline working weights.
- The spreadsheet says "5lb or 10lb" without specifying which exercises get which. User configures per exercise in settings.
- Rest between sets: 1-4 minutes based on your needs and the exercise.

### AMRAP Exercises (Black)

- Every set is AMRAP (as many reps as possible), targeting ~12 reps
- Drop weight between sets as needed
- Increase weight when consistently hitting 12+ reps (manual decision — user bumps weight in-app or Settings based on their judgment and history, no auto-progression)

### Deload

- Every 6th cycle: reduce all set counts by 2
- Standard exercises (3/2/1) become (1/0/0) on deload
- Blue exercises (2/1/0) become (0/0/0) on deload — effectively skip these
- Clamp all set counts to minimum 0

### Other

- Hit abs on rest days (reminder only, not tracked)

## Data Model

### AsyncStorage Schema

```
settings: {
  restTimerCompound: number,    // seconds, default 180
  restTimerAccessory: number,   // seconds, default 90
  units: "lb" | "kg",
  increments: {
    [exerciseName_reps]: number  // e.g. "bench_4": 5, "squat_4": 10
  },
  nutrition: {
    age: number,
    weight: number,
    height: number,
    sex: "male" | "female",
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active",
    goal: "bulk" | "cut" | "maintain"
  }
}

cycleState: {
  cycleNumber: number,          // 1-indexed, cycle 1 is no-PR baseline
  weekNumber: 1 | 2 | 3,
  nextDay: 1 | 2 | 3 | 5 | 6,
  isDeload: boolean             // true when cycleNumber % 6 === 0
}

weights: {
  [exerciseName_reps]: {        // e.g. "bench_4", "bench_8" tracked separately
    working: number,
    pr: number | null,          // working + increment, null during cycle 1
    prStatus: "pending" | "succeeded" | "failed" | null
  }
}

history: [
  {
    id: string,                 // UUID
    date: string,               // ISO date
    day: 1 | 2 | 3 | 5 | 6,
    week: 1 | 2 | 3,
    cycle: number,
    exercises: [
      {
        name: string,
        reps: number,           // target reps (4, 8, or 12)
        type: "red" | "blue" | "black",
        sets: [
          {
            weight: number,
            reps: number,       // actual reps completed
            isAmrap: boolean,
            isPr: boolean       // was this set at PR weight?
          }
        ]
      }
    ],
    completedAt: string | null  // ISO timestamp when workout finished
  }
]
```

### Canonical Exercise Keys

Every storage key uses this exact format (`name_reps`):

```
deadlift_4
chinups_8, chinups_4
bb_rows_4, bb_rows_8
curls_12
bench_4, bench_8
incline_press_4, incline_press_8
flies_12
tricep_ext_12
squat_4, squat_8
ohp_4, ohp_8
calf_raise_12
rear_delt_fly_12
lat_raise_12
```

These keys are used in `weights`, `settings.increments`, and `history.exercises`. The program definition maps to these keys; mismatches are bugs.

### Cycle / Week State Machine

`nextDay` advances through the sequence [1, 2, 3, 5, 6] in order. After completing a workout:

1. Advance `nextDay` to the next value in the sequence.
2. If `nextDay` wraps past 6 back to 1, increment `weekNumber`.
3. If `weekNumber` wraps past 3 back to 1, increment `cycleNumber`.
4. Recalculate `isDeload` (`cycleNumber % 6 === 0`, first deload is cycle 6).

The app always shows the next training day regardless of calendar date. There is no calendar-day mapping — if you skip a real-world day, the app just picks up where you left off. Training out of order is not supported; the guided flow enforces the sequence.

### PR Reset at Cycle Boundary

When `cycleNumber` increments (new cycle starts):

- For every Red/Blue exercise: `pr` = `working + increment`, `prStatus` = "pending"
- Exception: cycle 1 is the no-PR baseline (`pr` = null, `prStatus` = null)
- Exception: deload cycles still attempt PRs (reduced volume, same weight rules)
- A failed PR from the previous cycle has no carry-over — fresh attempt each cycle

### Abandoned / Partial Workouts

A `currentSession` key in AsyncStorage persists in-progress workout data:

```
currentSession: {
  startedAt: string,          // ISO timestamp
  day: number,
  week: number,
  cycle: number,
  exercises: [...]            // same shape as history.exercises, updated per-set
} | null
```

- Each completed set writes to `currentSession` immediately (crash-safe).
- On app launch, if `currentSession` is non-null, show "Resume workout?" prompt.
- "Finish workout" moves `currentSession` to `history` and clears it.
- "Discard workout" clears `currentSession` without saving. `cycleState` does not advance.

### Data Backup

Settings screen includes "Export Data" and "Import Data" options:

- Export: serializes all AsyncStorage keys to a single JSON file, saved via share sheet.
- Import: reads a JSON file and overwrites all keys (with confirmation prompt).
- No cloud sync, no accounts — just a file.

### Derived State (Not Stored)

- `nextWorkout`: derived from `cycleState.nextDay` + program definition + current week's set counts
- `todayExercises`: program definition filtered by day and week, with 0-set exercises removed
- `nutritionTargets`: calculated from settings.nutrition using Mifflin-St Jeor
- Chinups display: weight field and charts show ADDED weight only (0 = bodyweight). UI label says "Added Weight" not just "Weight" to avoid confusion.

## Screens

### 1. Home / Today

The landing screen. Shows at a glance:

- Current position: "Day 2 — Week 1, Cycle 3" (or "Deload Cycle" when applicable)
- List of today's exercises with: name, target sets × reps, weight (auto-filled from last session like Hevy)
- Exercises with 0 sets this week (Squat/DL in Week 3) shown as "Rest this week" and grayed out
- Nutrition summary card: daily calorie target + protein/carbs/fat macro split
- Single "Start Workout" button → launches Active Workout

On rest days (Day 4, Day 7): shows "Rest Day — hit abs" reminder, next workout preview, and nutrition card.

### 2. Active Workout (Fullscreen Modal)

Launched from Home. Guided mode — walks through each exercise in order.

**Per exercise:**
- Exercise name, set number (e.g., "Set 2 of 3"), target reps, current weight
- Previous performance shown inline (last session's weight × reps for this exercise, like Hevy)
- PR indicator badge on Week 1 compound sets when attempting new weight

**Logging a set (inspired by Strong's 3-tap-to-log philosophy):**
- Screen shows pre-filled weight + target reps
- If no adjustments needed: single tap "Complete Set"
- If adjusting: tap reps/weight field, adjust, tap "Complete Set"
- The "3 taps" refers to the full path: open app → start workout → complete first set

**After completing a set:**
- Haptic feedback
- Rest timer auto-starts (compound or accessory default based on exercise type)
- Timer visible as a countdown bar at bottom of screen, does not block UI
- User can dismiss timer early, extend it, or ignore it — next set always accessible
- Background notification if app is minimized

**AMRAP (Black) exercise specifics:**
- No fixed rep target — shows "AMRAP (~12)" as guidance
- After each set: quick +/- weight adjustment buttons for drop sets
- Previous set's reps displayed so user sees fatigue trend

**PR attempt flow (Red/Blue exercises, Cycle 2+):**
- Week 1: All sets at PR weight (working + increment). If all reps completed → carry PR weight into Week 2.
- Week 2: If Week 1 succeeded, sets at PR weight. If all reps completed → carry into Week 3.
- Week 3: If Week 2 succeeded, sets at PR weight. If all reps completed → PR becomes new working weight.
- If user fails reps on any set in any week → prompt: "Drop to working weight for this exercise for the rest of the cycle?"
- PR badge visible on all sets using PR weight (not just Week 1)
- Status tracked per exercise independently

**Workout completion:**
- Summary screen: exercises completed, total sets, any PRs hit
- Data saved to history
- cycleState advances to next day (wrapping week/cycle as needed)

### 3. Progress (Tab)

Per-exercise weight chart over cycles:
- X-axis: cycles/time, Y-axis: weight
- Toggle between exercises
- Separate lines for working weight vs PR attempts
- 1RM trend line (estimated from heaviest sets)
- Cycle success/fail indicators (green check / red X per cycle per exercise)

Current working weights dashboard: all compounds with current working weight at a glance.

Volume defined as: total sets completed (not sets × reps × weight). Used consistently in Progress and History tabs.

### 4. History (Tab)

Calendar view (month grid, dots on workout days like Hevy):
- Tap a date to see full session details
- Each session shows: day type, week, cycle, and all exercises with actual sets/reps/weight logged
- Weekly volume summary visible

### 5. Settings (Tab)

- **Weights:** starting/current working weight per exercise per rep scheme
- **Increments:** weight increase per exercise (default 5lb, configurable)
- **Rest timer:** separate defaults for compound vs accessory exercises
- **Units:** lb / kg toggle
- **Cycle position:** manual override for current cycle/week/day (for corrections)
- **Data:** Export all data as JSON / Import from JSON file
- **Nutrition calculator:**
  - Inputs: age, weight, height, sex, activity level
  - Goal: bulk / cut / maintain
  - Formula: Mifflin-St Jeor for TDEE
  - Output: daily calories, protein (1g per lb bodyweight — if user is in kg, convert: 2.2g per kg), fat (25% of cals), carbs (remainder). All values rounded to nearest whole number, no minimums enforced.
  - Results shown here and summarized on Home screen

## Navigation

Bottom tab bar with 4 tabs: **Today | Progress | History | Settings**

Active Workout is a fullscreen modal presented over the tab navigator.

## Onboarding (First Launch)

1. Select units (lb/kg)
2. Enter starting weight for each compound lift (Bench, OHP, Squat, Deadlift, BB Rows, Incline Press). For Chinups, weight field represents added weight (0 if bodyweight only).
3. Set rest timer preferences
4. Optionally enter nutrition info
5. First cycle runs without PR attempts (as per program rules)

## Design Principles (Informed by Strong, Hevy, Industry Research)

- **3 taps max** from opening the app to logging a set
- **Dark mode default** — standard gym lighting
- **Large touch targets** — usable with sweaty hands mid-set
- **Bold, minimal typography** — readable at arm's length on a bench
- **Auto-fill everything** — previous weights, target reps, timer durations
- **No clutter** — the program is hardcoded, so there's no routine builder, exercise library, or social features
- **Haptic feedback** on set completion
- **Rest timer never blocks** — always dismissible, next set always accessible
