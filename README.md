# Just Pull

A weightlifting tracker for the **Lvysaur Intermediate Aesthetic Routine**, built with Expo and React Native.

## What It Does

- Tracks a 5-day/week, 3-week cycling program with automatic set tapering and deload scheduling
- Logs every set with weight and reps, tracks personal records via AMRAP sets
- Calculates estimated 1RM (Epley formula) and suggests warmup progressions
- Visualizes per-muscle training volume on an interactive body figure with body-fat-aware rendering
- Computes TDEE and macro targets (Mifflin-St Jeor) based on user stats and goals
- Includes a configurable rest timer with separate durations for compound and accessory lifts

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `w` for web, `i` for iOS simulator, `a` for Android emulator.

## Running Tests

```bash
npm test
```

## Tech Stack

- **Expo SDK 54** / React Native 0.81
- **Expo Router** (file-based routing)
- **AsyncStorage** for local persistence
- **React Native SVG** for body visualization
- **React Native Reanimated** for animations

## Design

"Iron & Ember" — a dark theme with amber accents on near-black surfaces. Bebas Neue for display numbers, Plus Jakarta Sans for body text.
