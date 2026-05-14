// FORGE Design System
// Brutalist, pitch-black, signal-orange. Slabs share edges. The lift dominates.

export const colors = {
  // Surfaces
  bg: "#000000",
  surface: "#0A0A0A",
  surfaceElevated: "#131313",
  surfaceTertiary: "#1C1C1C",

  // Hairlines / borders
  hairline: "#232323",
  hairlineSoft: "#161616",
  hairlineStrong: "#353535",

  // Accent — signal orange "the ember"
  accent: "#FF4D14",
  accentHot: "#FF6D3D",
  accentGlow: "rgba(255, 77, 20, 0.12)",
  accentDim: "#D83A07",

  // Semantic
  green: "#5BD488",
  greenGlow: "rgba(91, 212, 136, 0.08)",
  red: "#FF3B3B",
  pr: "#FFB84D",
  prGlow: "rgba(255, 184, 77, 0.06)",

  // Text
  text: "#F2F0EB",
  textSecondary: "#8A857A",
  textTertiary: "#4D4A44",
  textInverse: "#0A0A0A",

  // Borders (legacy compat)
  cardBorder: "rgba(255, 255, 255, 0.04)",

  // Separators
  separator: "#232323",

  // Overlays
  overlay: "rgba(0, 0, 0, 0.85)",
};

// Font families — FORGE typography stack
export const fonts = {
  display: "Anton_400Regular",           // condensed display numerals
  displayFallback: "BebasNeue_400Regular",
  regular: "SpaceGrotesk_400Regular",    // body text
  medium: "SpaceGrotesk_500Medium",
  semiBold: "SpaceGrotesk_600SemiBold",
  bold: "SpaceGrotesk_700Bold",
  mono: "JetBrainsMono_400Regular",      // labels, data
  monoMedium: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
};

export const typography = {
  // Display numbers — Anton
  displayXL: {
    fontFamily: fonts.display,
    fontSize: 56,
    letterSpacing: -0.5,
  },
  displayLarge: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -0.3,
  },
  displayMedium: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -0.2,
  },
  displaySmall: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.1,
  },

  // Body text — Space Grotesk
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  bodyBold: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },

  // Labels — JetBrains Mono
  caption: {
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1.6,
  },
  micro: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1.6,
    color: colors.textSecondary,
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
  none: 0,
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
};
