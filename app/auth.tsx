import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signIn, signUp } from "../src/lib/auth";
import { colors, fonts } from "../src/theme";

const friendlyError = (msg: string) => {
  if (msg.includes("Invalid login")) return "Incorrect email or password.";
  if (msg.includes("already registered"))
    return "An account with this email already exists. Try signing in.";
  if (msg.includes("Password"))
    return "Password must be at least 6 characters.";
  return "Something went wrong. Please try again.";
};

type Mode = "signin" | "create";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert("Error", friendlyError(error.message));
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert("Error", friendlyError(error.message));
  };

  const handleCTA = mode === "signin" ? handleSignIn : handleSignUp;
  const ctaLabel = mode === "signin" ? "SIGN IN ▸" : "CREATE ACCOUNT ▸";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ── Wordmark slab ── */}
        <View style={styles.wordmark}>
          <Text style={styles.volLabel}>VOL. 01 · THE PROGRAM</Text>
          <Text style={styles.display}>
            JUST{"\n"}PULL<Text style={styles.displayDot}>.</Text>
          </Text>
          <Text style={styles.tagline}>
            A LOGBOOK FOR THE LVYSAUR{"\n"}INTERMEDIATE AESTHETIC ROUTINE.
          </Text>
        </View>
        <View style={styles.strongDivider} />

        {/* ── Mode tabs ── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === "signin" && styles.tabActive]}
            onPress={() => setMode("signin")}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "signin" }}
            accessibilityLabel="Sign in tab"
          >
            <Text
              style={[
                styles.tabText,
                mode === "signin" && styles.tabTextActive,
              ]}
            >
              SIGN IN
            </Text>
          </TouchableOpacity>
          <View style={styles.tabDivider} />
          <TouchableOpacity
            style={[styles.tab, mode === "create" && styles.tabActive]}
            onPress={() => setMode("create")}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "create" }}
            accessibilityLabel="Create account tab"
          >
            <Text
              style={[
                styles.tabText,
                mode === "create" && styles.tabTextActive,
              ]}
            >
              CREATE
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hairlineDivider} />

        {/* ── Email input slab ── */}
        <View style={styles.inputSlab}>
          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="email@address.com"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            editable={!loading}
            accessibilityLabel="Email address"
          />
        </View>

        {/* ── Password input slab ── */}
        <View style={styles.inputSlab}>
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            accessibilityLabel="Password"
          />
        </View>

        {/* ── Spacer ── */}
        <View style={styles.spacer} />

        {/* ── CTA slab ── */}
        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaDisabled]}
          onPress={handleCTA}
          disabled={loading}
          activeOpacity={0.7}
          accessibilityLabel={
            mode === "signin" ? "Sign in" : "Create account"
          }
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          )}
        </TouchableOpacity>

        {/* ── Footer toggle ── */}
        <View style={styles.footer}>
          {mode === "signin" ? (
            <Text style={styles.footerText}>
              NO ACCOUNT?{" "}
              <Text
                style={styles.footerLink}
                onPress={() => setMode("create")}
              >
                CREATE
              </Text>
            </Text>
          ) : (
            <Text style={styles.footerText}>
              EXISTING USER?{" "}
              <Text
                style={styles.footerLink}
                onPress={() => setMode("signin")}
              >
                SIGN IN
              </Text>
            </Text>
          )}
        </View>

        {/* Bottom safe area padding */}
        <View style={{ height: Math.max(insets.bottom, 16) }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },

  // ── Wordmark slab ──
  wordmark: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  volLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 12,
  },
  display: {
    fontFamily: fonts.display,
    fontSize: 76,
    lineHeight: 72,
    color: colors.text,
  },
  displayDot: {
    color: colors.accent,
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    lineHeight: 11 * 1.5,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: 10,
    maxWidth: 240,
  },
  strongDivider: {
    height: 1,
    backgroundColor: colors.hairlineStrong,
  },

  // ── Mode tabs ──
  tabRow: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  tabText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.textInverse,
  },
  tabDivider: {
    width: 1,
    backgroundColor: colors.hairlineSoft,
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: colors.hairline,
  },

  // ── Input slabs ──
  inputSlab: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineStrong,
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },

  // ── Spacer ──
  spacer: {
    flex: 1,
    minHeight: 20,
  },

  // ── CTA button ──
  ctaButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: 26 * 0.06,
    textTransform: "uppercase",
  },
  ctaDisabled: {
    opacity: 0.5,
  },

  // ── Footer ──
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  footerLink: {
    color: colors.accent,
  },
});
