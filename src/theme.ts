export const colors = {
  // Backgrounds (Apple dark mode system)
  bg: "#000000",                    // Pure black (OLED)
  surface: "#1C1C1E",              // systemGray6 dark — cards
  surfaceElevated: "#2C2C2E",     // systemGray5 dark — elevated cards/modals
  surfaceTertiary: "#3A3A3C",     // systemGray4 dark — inputs

  // Text (Apple dark mode)
  text: "#FFFFFF",
  textSecondary: "#EBEBF5CC",     // secondaryLabel (60% white)
  textTertiary: "#EBEBF54D",      // tertiaryLabel (30% white)

  // Accent (Apple system colors dark)
  accent: "#0A84FF",              // systemBlue
  green: "#30D158",               // systemGreen — set completion
  red: "#FF453A",                 // systemRed — failures/PR fail
  orange: "#FF9F0A",              // systemOrange — warnings/AMRAP
  teal: "#64D2FF",                // systemTeal — PR attempts

  // Separators
  separator: "#38383A",           // separator dark
  separatorLight: "#54545855",    // opaqueSeparator
};

export const typography = {
  // Large display numbers (weights, calories)
  displayLarge: { fontSize: 34, fontWeight: "700" as const, letterSpacing: 0.4 },
  displayMedium: { fontSize: 28, fontWeight: "600" as const, letterSpacing: 0.3 },

  // Titles
  title1: { fontSize: 22, fontWeight: "700" as const, letterSpacing: 0.3 },
  title2: { fontSize: 20, fontWeight: "600" as const, letterSpacing: 0.3 },
  title3: { fontSize: 17, fontWeight: "600" as const },

  // Body
  body: { fontSize: 17, fontWeight: "400" as const },
  bodyBold: { fontSize: 17, fontWeight: "600" as const },

  // Captions
  caption1: { fontSize: 12, fontWeight: "400" as const },
  caption2: { fontSize: 11, fontWeight: "400" as const, letterSpacing: 0.5, textTransform: "uppercase" as const },
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
