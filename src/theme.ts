// Iron & Ember Design System
// A lifting app that feels like forged metal — dark, powerful, precise.

export const colors = {
  // Backgrounds
  bg: "#0B0B0E",                    // Near-black, barely warm
  surface: "#151518",              // Cards — barely visible elevation
  surfaceElevated: "#1E1E22",     // Elevated content, modals, inputs
  surfaceTertiary: "#28282D",     // Pressed states, active inputs

  // Accent — "the ember"
  accent: "#E8A838",               // Warm amber
  accentDim: "#C7792F",           // Deeper amber for pressed states
  accentGlow: "rgba(232, 168, 56, 0.12)", // Subtle amber glow

  // Semantic
  green: "#5BD488",                // Soft mint — set completion
  red: "#E85454",                  // Warm red — danger
  pr: "#E8A838",                   // PRs are golden (same as accent)

  // Text
  text: "#F2F0EB",                 // Warm white — NOT pure white
  textSecondary: "#8A897F",       // Warm gray
  textTertiary: "#504F48",        // Dark warm gray

  // Separators
  separator: "#1E1E22",
};

// Font families — must match exact names from expo-google-fonts
export const fonts = {
  display: "BebasNeue_400Regular",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

export const typography = {
  // Display numbers — Bebas Neue
  displayXL: {
    fontFamily: fonts.display,
    fontSize: 56,
  },
  displayLarge: {
    fontFamily: fonts.display,
    fontSize: 40,
  },
  displayMedium: {
    fontFamily: fonts.display,
    fontSize: 32,
  },
  displaySmall: {
    fontFamily: fonts.display,
    fontSize: 24,
  },

  // Body text — Plus Jakarta Sans
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  subtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  bodyBold: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
  },
  micro: {
    fontFamily: fonts.regular,
    fontSize: 10,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 32,
  xxl: 44,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};
