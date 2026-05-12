# Body Figure — "The Mirror"

A smooth SVG human figure that morphs based on real training data and body composition. Muscles grow with training, shrink with inactivity, and body proportions shift with body fat %. A timeline slider lets you scrub through your history and watch the transformation.

## Purpose

Motivation mirror. The visual transformation IS the reward for consistency.

## Muscle Model — Decaying Effective Volume

Each muscle group has an "effective size" score from 0.0 (untrained) to 1.0 (fully developed).

### Training Adds Volume

Each completed set for a muscle group increases its score. Diminishing returns apply:
- 0-10 weekly sets: full contribution (each set adds ~0.01 to the weekly gain)
- 10-20 weekly sets: half contribution
- 20+ weekly sets: minimal additional benefit

Weekly gain is capped at ~0.05 per muscle group per week (it takes ~20 weeks of consistent training to go from 0 to 1.0).

### Decay When Not Trained

Exponential decay with a half-life of 21 days (3 weeks):
```
effectiveSize(t) = effectiveSize(t0) * (0.5 ^ (daysSinceLastTrained / 21))
```

Timeline:
- 3 weeks off: ~50% of gained size lost
- 6 weeks off: ~75% lost
- 12 weeks off: ~94% lost, near baseline

### Muscle Memory

Peak historical size is stored per muscle. When retraining a muscle that previously reached a higher level, gains accumulate at 2x the normal rate until the previous peak is reached.

```
memoryMultiplier = currentSize < peakSize ? 2.0 : 1.0
```

### Per-Muscle Independence

Each of the 10 muscle groups decays and grows independently. Skip legs for a month while training upper body → legs visibly shrink, upper body holds.

### Exercise-to-Muscle Mapping

| Exercise Key | Muscles Affected |
|---|---|
| deadlift_4 | back (0.4), glutes (0.3), hamstrings (0.2), forearms (0.1) |
| squat_4, squat_8 | quads (0.4), glutes (0.3), hamstrings (0.2), calves (0.1) |
| bench_4, bench_8 | chest (0.5), shoulders (0.3), triceps (0.2) |
| ohp_4, ohp_8 | shoulders (0.5), triceps (0.3), chest (0.2) |
| chinups_4, chinups_8 | back (0.5), biceps (0.4), forearms (0.1) |
| bb_rows_4, bb_rows_8 | back (0.4), biceps (0.3), forearms (0.2), shoulders (0.1) |
| incline_press_4, incline_press_8 | chest (0.4), shoulders (0.4), triceps (0.2) |
| curls_12 | biceps (0.8), forearms (0.2) |
| flies_12 | chest (0.9), shoulders (0.1) |
| tricep_ext_12 | triceps (0.9), chest (0.1) |
| calf_raise_12 | calves (1.0) |
| rear_delt_fly_12 | shoulders (0.6), back (0.4) |
| lat_raise_12 | shoulders (1.0) |

Numbers are weight distribution — a set of bench contributes 0.5 "set equivalents" to chest, 0.3 to shoulders, 0.2 to triceps.

## Body Fat Model

### From Manual Logs

User logs bodyweight + BF% every 2-4 weeks in Settings. Between logs, the figure interpolates linearly.

### Drift When Inactive

If no BF% log exists within 4 weeks AND training frequency has dropped below 2 sessions/week:
- BF% drifts upward at 0.5% per month of reduced activity
- Capped at the user's highest recorded BF% (won't drift beyond what they've measured)

If training is consistent (3+ sessions/week), BF% holds steady between logs.

## SVG Figure Architecture

### Control Points

The body is defined as ~80-100 cubic bezier control points forming:
- Outer silhouette (head, neck, shoulders, arms, torso, waist, hips, legs, feet)
- Internal muscle separation lines (pec line, ab lines, quad separation, bicep/tricep separation)

Control points are grouped by muscle region. Each region has:
- `basePoints`: the untrained/default position
- `trainedPoints`: the fully-developed position (wider shoulders, thicker arms, etc.)
- Current points interpolated: `lerp(basePoints, trainedPoints, effectiveSize)`

### Regions and Their Morphing Effects

| Region | What Changes | Driven By |
|--------|-------------|-----------|
| Shoulders | Width of deltoid contour | shoulders effectiveSize |
| Chest | Pec fullness, width of upper torso | chest effectiveSize |
| Arms (upper) | Bicep/tricep contour thickness | avg(biceps, triceps) effectiveSize |
| Forearms | Forearm width | forearms effectiveSize |
| Upper back | Lat spread (visible from front as V-taper) | back effectiveSize |
| Core/waist | Width narrows as BF% drops | bodyFatPercent (inverse) |
| Quads | Thigh width and sweep | quads effectiveSize |
| Glutes/hips | Hip width | glutes effectiveSize |
| Hamstrings | Rear thigh contour (visible on back view) | hamstrings effectiveSize |
| Calves | Calf diamond width | calves effectiveSize |

### Body Fat Effects on the SVG

- **BF > 20%**: Rounded contours, no muscle separation lines visible, wider waist
- **BF 15-20%**: Slight muscle outlines visible (faint strokes), moderate waist
- **BF 12-15%**: Clear muscle separation lines, narrower waist, visible V-taper
- **BF < 12%**: Strong definition lines, narrow waist, all muscle groups clearly separated, visible ab lines

Implemented as:
- `separationStrokeOpacity = clamp((20 - bodyFatPercent) / 8, 0, 1)`
- `waistScale = 1.0 + (bodyFatPercent - 12) * 0.01` (wider with higher BF)
- `contourSoftness` affects bezier curve control point spread (higher BF = rounder curves)

### Rendering

- react-native-svg `Path` elements with cubic bezier commands
- Fill: dark surface color with subtle gradient (top-lit)
- Muscle regions: slightly different shades to show separation
- This week's trained muscles: amber glow overlay (from existing heatmap data)
- Muscle definition lines: thin strokes, opacity driven by BF%

## Body Screen (New 5th Tab)

### Layout

- **Top**: "THE MIRROR" caption label
- **Center**: SVG figure, ~55% of screen height. Front view by default, tap to flip to back view.
- **Stats row below figure**: Three columns — Bodyweight (Bebas Neue displayMedium), BF% (Bebas Neue displayMedium), Months Trained (Bebas Neue displayMedium). Labels in caption style below each.
- **Timeline slider**: Full-width horizontal slider at bottom. Left = first workout date, right = today. Scrubbing morphs the figure smoothly. Date label above slider thumb.
- **This week's glow**: Muscles trained in the current week glow amber, like hot iron.

### Empty State

When no workout history exists:
- Show the figure at baseline (untrained proportions)
- "Complete your first workout to start tracking"
- When no body log exists: show a prompt to log first measurement

### Interactions

- **Tap figure**: flips front ↔ back view
- **Scrub timeline**: figure morphs, stats update to that point in time
- **Long press muscle**: shows muscle name + effective size % as a tooltip

## Data Storage

### New Type

```
BodyLog {
  date: string        // ISO date
  weight: number      // in user's units
  bodyFatPercent: number
}
```

### New AsyncStorage Key

`bodyLog`: BodyLog[] — append-only array.

### New Storage Helpers

- `getBodyLog(): Promise<BodyLog[]>`
- `appendBodyLog(entry: BodyLog): Promise<void>`

### Context Additions

- `bodyLog` added to AppState
- `addBodyLog` added to AppContextValue

## Body Measurement Entry

In Settings, new "Body Measurements" section:
- "Log Measurement" button → modal with:
  - Body weight numeric input (pre-filled with last logged value)
  - Body fat % numeric input (pre-filled with last logged value)
  - Date (defaults to today)
- History of past entries shown as a compact list (date, weight, BF%)
- Ability to delete an entry (swipe or long-press)

## Computation

### New Module: `src/hooks/useBodyModel.ts`

Core function: `computeMuscleStates(history: WorkoutLog[], bodyLog: BodyLog[], asOfDate: Date)`

Returns:
```
{
  muscles: Record<string, number>    // effectiveSize 0-1 per muscle
  bodyFatPercent: number             // interpolated or drifted
  bodyWeight: number                 // interpolated
  monthsTrained: number
  peakMuscles: Record<string, number> // for muscle memory
}
```

Algorithm:
1. Sort workout history by date
2. For each workout up to `asOfDate`:
   - For each exercise in the workout, distribute sets to muscle groups using the weight mapping
   - Add to each muscle's "raw weekly volume" accumulator
3. At each week boundary:
   - Convert raw weekly volume to a gain value (with diminishing returns)
   - Apply muscle memory multiplier if below peak
   - Add gain to each muscle's effective size
   - Apply decay to muscles not trained that week
   - Clamp all values to [0, 1]
   - Update peak values
4. Interpolate body fat from bodyLog entries (linear between measurements, drift when gaps + inactivity)

This function is pure — takes data in, returns state out. Fully testable.

## Navigation

Add "Body" as 5th tab between History and Settings:
- Icon: `body-outline` from Ionicons
- Label: "BODY" in the existing caption tab label style

## Files

New files:
- `src/hooks/useBodyModel.ts` — pure computation
- `src/__tests__/useBodyModel.test.ts` — tests
- `src/components/BodyFigure.tsx` — SVG figure component
- `app/(tabs)/body.tsx` — Body screen

Modified files:
- `src/types.ts` — add BodyLog type
- `src/storage.ts` — add bodyLog helpers
- `src/context.tsx` — add bodyLog to state
- `app/(tabs)/_layout.tsx` — add Body tab
- `app/(tabs)/settings.tsx` — add Body Measurements section
