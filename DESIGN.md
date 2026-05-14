# Design System: Iron & Ember

## Theme

Dark. A lifter glancing at their phone under harsh gym fluorescents, between sets, breathing hard. Dark backgrounds reduce glare, amber accents cut through peripheral vision. The near-black surface reads as a tool, not an app.

## Color

Strategy: **Restrained.** Tinted neutrals with a single amber accent at ~8% surface coverage. The amber ("the ember") marks interactive elements, PRs, and active states. Everything else recedes.

### Palette

| Role | Value | Usage |
|------|-------|-------|
| bg | `#0B0B0E` | App background. Near-black, barely warm. |
| surface | `#16161A` | Cards, containers. Slight elevation. |
| surfaceElevated | `#1E1E22` | Modals, inputs, elevated content. |
| surfaceTertiary | `#28282D` | Pressed states, active inputs. |
| accent | `#E8A838` | Warm amber. Buttons, PRs, highlights. |
| accentDim | `#C7792F` | Pressed/secondary amber. |
| accentGlow | `rgba(232, 168, 56, 0.12)` | Subtle amber tint for active backgrounds. |
| green | `#5BD488` | Soft mint. Set completion, success. |
| red | `#E85454` | Warm red. Danger, destructive actions. |
| text | `#F2F0EB` | Primary text. Warm white, never pure. |
| textSecondary | `#8A897F` | Labels, secondary info. Warm gray. |
| textTertiary | `#504F48` | Hints, disabled text. Dark warm gray. |
| separator | `#1E1E22` | Dividers, borders. |
| cardBorder | `rgba(255, 255, 255, 0.04)` | Barely-visible edge on cards. |

## Typography

Two-family system. Display font for numbers and impact; body font for everything readable.

### Families

| Role | Family | Weight |
|------|--------|--------|
| Display | Bebas Neue | 400 (Regular) |
| Body | Plus Jakarta Sans | 400, 500, 600, 700 |

### Scale

| Token | Family | Size | Usage |
|-------|--------|------|-------|
| displayXL | Bebas Neue | 56 | Hero numbers (weight display) |
| displayLarge | Bebas Neue | 40 | Timer, large counters |
| displayMedium | Bebas Neue | 32 | Day numbers, section headers |
| displaySmall | Bebas Neue | 24 | Card weights, secondary numbers |
| title | Jakarta Bold | 20 | Screen titles |
| subtitle | Jakarta SemiBold | 16 | Section labels |
| body | Jakarta Regular | 15 | Body text |
| bodyBold | Jakarta SemiBold | 15 | Emphasized body |
| caption | Jakarta Medium | 11 | Uppercase labels, 1.5px tracking |
| micro | Jakarta Regular | 10 | Hints, metadata |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4 | Tight gaps, inline spacing |
| sm | 8 | Between related elements |
| md | 16 | Standard padding, card internal |
| lg | 20 | Section spacing |
| xl | 32 | Major section breaks |
| xxl | 44 | Screen-level top padding |

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 8 | Small elements, pills, tags |
| md | 12 | Inputs, small cards |
| lg | 16 | Cards, containers |
| xl | 20 | Large modals, major cards |

## Elevation

No shadows. Elevation communicated through background color stepping: bg < surface < surfaceElevated < surfaceTertiary. Cards use a barely-visible `cardBorder` edge.

## Components

### ExerciseCard
Surface card with exercise name, set/rep scheme, and weight. Color-coded by exercise type (red, blue, black mapping to compound/heavy/accessory). Grayed out when resting (0 sets).

### SetLogger
Full-screen logging interface. Weight adjuster (large display number with +/- buttons), reps counter, and LOG SET button (green, full-width). Appears during active workout.

### RestTimer
Top-of-screen timer bar. Amber progress line, large time display, Dismiss/+30s controls. Renders in document flow above SetLogger.

### WorkoutSummary
Completion screen. Checkmark, exercise list with set counts, total sets, Finish (amber) and Discard (red text) buttons.

### NutritionCard
Calorie display with macro breakdown (protein/carbs/fat as colored pills). Green for protein, amber for carbs, darker amber for fat.

### CalendarGrid
Month calendar with green dots on workout days. Amber highlight on selected date. Navigation arrows for month switching.

### ProgressChart
Custom SVG-less chart using positioned Views. Y-axis ticks, data dots, line segments rendered via absolute positioning and rotation. Latest value callout.

### MuscleHeatmap
Two-column (Front/Back) muscle group list with amber heat coloring based on weekly set volume (cold/warm/hot/fire tiers).

### BodyFigure
Body composition visualization using real body photos at 9 BF% levels with crossfade interpolation. Front/back toggle.

## Motion

Minimal. Transitions use 120ms fade out, 200ms fade in (onboarding steps). Rest timer pulses at 500ms intervals when urgent (<=10s). No spring, no bounce, no elastic. Haptic feedback on set completion (medium impact).

## Platform

React Native (Expo SDK 54). All styling via React Native StyleSheet. No external CSS framework. Fonts loaded from local assets.
