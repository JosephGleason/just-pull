# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npx expo start` (add `--web`, `--ios`, or `--android` for specific platforms)
- **Run tests:** `npm test`
- **Run single test:** `npx jest src/__tests__/useWorkout.test.ts`
- **Lint:** `npm run lint` (runs `expo lint`)
- **Type check:** `npx tsc --noEmit`

## Architecture

Expo Router app (SDK 54, React Native 0.81) implementing a weightlifting tracker for the Lvysaur Intermediate Aesthetic Routine. Uses file-based routing with the React Compiler experiment enabled.

### Program Model

The training program is a fixed 5-day/week schedule (days 1, 2, 3, 5, 6) running in 3-week cycles. Volume **ascends** within each cycle — you introduce PR weight at low volume in Week 1 and build up through Week 3. Exercises have a color-coded type system:
- **red** — compound lifts with 3/4/5 ascending sets across weeks
- **blue** — heavy compounds (squat, deadlift) with 4/5/6 ascending sets
- **black** — accessories with the same 3/4/5 ascending sets (AMRAP)

The set arrays in `src/program.ts` are `[week1, week2, week3]`. In the original spreadsheet, the 6 Set columns represent the max possible; **x marks cross off unused columns** (e.g. x in Set 5 & 6 = only do sets 1-4). Blank cells are where you log your work.

After every 6th cycle, a deload subtracts 2 from set counts. The program definition lives entirely in `src/program.ts`.

### State & Data Sync

All app state lives in **Legend-State observables** (`src/lib/store.ts`) synced to **Supabase Postgres** via `@legendapp/state/sync-plugins/supabase`. Components read state with `useSelector()` from `@legendapp/state/react` — there is no React Context or custom provider.

Each observable is configured with:
- **AsyncStorage persistence** — offline-first local cache with `retrySync: true`
- **Supabase sync** — two-way sync filtered by `user_id`/`id`
- **Realtime** — `cycle_state$`, `current_session$`, and `weights$` subscribe to Supabase Realtime for cross-device sync
- **Infinite retry** — queued writes replay automatically on reconnect

Single-row tables (`profile$`, `nutrition$`, `cycle_state$`, `current_session$`) use `as: "value"`. Collection tables (`weights$`, `increments$`, `workouts$`, `body_log$`) use the default object mode.

`current_session$` intentionally disables soft deletes — `set(null)` issues a hard DELETE so other devices receive the Realtime DELETE event.

### Auth

Supabase Auth with email/password (`src/lib/auth.ts`). An `auth$` observable holds `{ uid, loading }` and gates all data sync via `waitFor: auth$.uid`. The root layout (`app/_layout.tsx`) reads `auth$`, `profile$`, and `is_ready$` to route between `auth.tsx`, `onboarding.tsx`, and the main tabs.

### Routing

- `app/_layout.tsx` — root layout; gates auth → onboarding → tabs based on `auth$`/`profile$`
- `app/auth.tsx` — sign-in / sign-up screen
- `app/onboarding.tsx` — initial weight setup flow
- `app/(tabs)/` — main tab navigation (Today, Progress, History, Body, Settings)
- `app/workout.tsx` — full-screen modal for active workout session

### Key Hooks

- `useWorkout` — workout lifecycle (start, log sets, PR tracking, finish/discard)
- `useCycleState` — advances day/week/cycle state, triggers deloads
- `useOneRepMax` — Epley formula 1RM estimation from AMRAP sets
- `useBodyModel` — maps workout history to per-muscle fatigue scores for the body visualization
- `useWarmup` — generates warmup set progressions for compounds
- `useNutrition` — Mifflin-St Jeor TDEE and macro calculations
- `useTimer` — rest timer with configurable compound/accessory durations

### Design System

**FORGE** — brutalist, pitch-black design system defined in `src/theme.ts`. Key tokens: Anton for display numerals, Space Grotesk for body text, JetBrains Mono for labels/data, signal-orange accent (`#FF4D14`) on pure black. Zero border radius throughout. Shared FORGE styles (`forgeStyles`) provide slabs, hairlines, selector rows. All styling uses React Native `StyleSheet` — no external CSS framework.

### Body Visualization

The Body tab renders a body figure (`src/components/BodyFigure.tsx`) that composites real body images at 9 body-fat levels (`assets/body/bf_*.png`) with crossfade interpolation. SVG-based muscle heatmap and fat overlay layers are defined in `src/components/body/`.
