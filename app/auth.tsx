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
import { colors, typography, spacing, radius } from "../src/theme";

const friendlyError = (msg: string) => {
  if (msg.includes("Invalid login")) return "Incorrect email or password.";
  if (msg.includes("already registered")) return "An account with this email already exists. Try signing in.";
  if (msg.includes("Password")) return "Password must be at least 6 characters.";
  return "Something went wrong. Please try again.";
};

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top + 16, 60) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>JUST PULL</Text>
          <Text style={styles.subtitle}>
            Sign in to sync your training
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View>
            <Text style={styles.inputLabel}>Email</Text>
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
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createAccountButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.createAccountButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  brand: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 18,
    color: colors.accent,
    letterSpacing: 6,
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.body,
    lineHeight: 22,
  },

  // Form
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputLabel: {
    color: colors.textSecondary,
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    color: colors.text,
    ...typography.body,
    height: 52,
    paddingHorizontal: spacing.md,
  },

  // Buttons
  buttons: {
    gap: spacing.md,
  },
  signInButton: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  signInButtonText: {
    color: colors.bg,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
  },
  createAccountButton: {
    backgroundColor: colors.surface,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  createAccountButtonText: {
    color: colors.textSecondary,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
