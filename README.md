# Just Pull

A weightlifting tracker for the **Lvysaur Intermediate Aesthetic Routine**, built with Expo and React Native.

## What It Does

- Tracks a 5-day/week, 3-week cycling program with automatic set tapering and deload scheduling
- Logs every set with weight and reps, tracks personal records via AMRAP sets
- Calculates estimated 1RM (Epley formula) and suggests warmup progressions
- Visualizes per-muscle training volume on an interactive body figure with body-fat-aware rendering
- Computes TDEE and macro targets (Mifflin-St Jeor) based on user stats and goals
- Includes a configurable rest timer with separate durations for compound and accessory lifts

## Setup

Just Pull stores its data in a [Supabase](https://supabase.com) project (email/password auth plus a Postgres database), so you need one before the app will run.

1. **Environment variables.** Copy `.env.example` to `.env` and fill in the two values from your Supabase project's API settings:

   | Variable | Value |
   |---|---|
   | `EXPO_PUBLIC_SUPABASE_URL` | Your project URL, e.g. `https://YOUR-PROJECT.supabase.co` |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your project's anon (public) key |

   Expo inlines `EXPO_PUBLIC_*` variables into the client bundle, so the anon key ships inside the app. That is only safe with Row Level Security enabled (step 3).

2. **Tables.** No SQL migrations are included in this repo; `src/lib/store.ts` and `src/types.ts` are the reference for what the code expects. The app touches eight tables:

   - One row per user, keyed by `id` = the user's auth UID: `profiles`, `nutrition_settings`, `cycle_state`, `current_session`
   - Many rows per user, each with a `user_id` column: `exercise_weights`, `increments`, `workouts`, `body_log` (the sync layer keys `exercise_weights` and `increments` by an `exercise_key` column)

   The sync layer is configured with `created_at` / `updated_at` timestamp columns and a `deleted` flag for soft deletes (`current_session` is the exception and is hard-deleted). The code also expects each new user's `profiles` row to be created by a database trigger on signup; the app only reads and updates it.

3. **Row Level Security.** Enable RLS on every table with policies that restrict rows to their owner: `auth.uid() = user_id` for the per-user collection tables and `auth.uid() = id` for the single-row tables. Without RLS, anyone holding the anon key can read and write every user's data.

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
- **Supabase** for email/password auth and cloud data (Postgres)
- **Legend-State** with its `syncedSupabase` plugin for state and sync, persisted locally in **AsyncStorage** (offline cache with retry-until-synced)
- **React Native SVG** for body visualization
- **React Native Reanimated** for animations

## Design

"Iron & Ember" — a dark theme with amber accents on near-black surfaces. Bebas Neue for display numbers, Plus Jakarta Sans for body text.

## Credits

The training program is lvysaur's Intermediate Aesthetic Routine, shared on Reddit. The spreadsheet in the repo root (`lvysaur's Intermediate Aesthetic Routine Print.xlsx`) is their file.
