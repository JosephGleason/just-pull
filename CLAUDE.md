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

The training program is a fixed 5-day/week schedule (days 1, 2, 3, 5, 6) running in 3-week cycles. Exercises have a color-coded type system:
- **red** — compound lifts with 3/2/1 set taper across weeks
- **blue** — heavy compounds (squat, deadlift) with 2/1/0 set taper
- **black** — accessories with the same 3/2/1 taper

After every 3rd cycle, a deload week subtracts 2 from set counts. The program definition lives entirely in `src/program.ts`.

### State & Persistence

All app state flows through a single React Context (`src/context.tsx` → `AppProvider`). The context holds settings, cycle state, exercise weights, workout history, current session, and body log. Each setter persists to AsyncStorage via `src/storage.ts`, so the context is the single source of truth for both in-memory and persisted state.

### Routing

- `app/_layout.tsx` — root layout; redirects to onboarding if no settings exist
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

"Iron & Ember" dark theme defined in `src/theme.ts`. Key tokens: Bebas Neue for display numbers, Plus Jakarta Sans for body text, amber accent (`#E8A838`) on near-black backgrounds. All styling uses React Native `StyleSheet` — no external CSS framework.

### Body Visualization

The Body tab renders a body figure (`src/components/BodyFigure.tsx`) that composites real body images at 9 body-fat levels (`assets/body/bf_*.png`) with crossfade interpolation. SVG-based muscle heatmap and fat overlay layers are defined in `src/components/body/`.
