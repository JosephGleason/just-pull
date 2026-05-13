import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { useSelector } from "@legendapp/state/react";
import { initAuth, auth$ } from "../src/lib/auth";
import { profile$, is_ready$ } from "../src/lib/store";
import { colors } from "../src/theme";

function RootNavigator() {
  const isReady = useSelector(is_ready$);
  const uid = useSelector(auth$.uid);
  const profile = useSelector(profile$);

  if (!isReady) {
    return (
      <View style={splashStyles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const needsAuth = uid === null;
  const needsOnboarding = !needsAuth && (profile === undefined || profile?.onboarding_complete === false);
  const ready = !needsAuth && !needsOnboarding;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" redirect={!needsAuth} />
        <Stack.Screen name="onboarding" redirect={!needsOnboarding} />
        <Stack.Screen name="(tabs)" redirect={!ready} />
        <Stack.Screen
          name="workout"
          options={{ presentation: "fullScreenModal", gestureEnabled: false }}
          redirect={!ready}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "BebasNeue_400Regular": require("../assets/fonts/BebasNeue_400Regular.ttf"),
    "PlusJakartaSans_400Regular": require("../assets/fonts/PlusJakartaSans_400Regular.ttf"),
    "PlusJakartaSans_500Medium": require("../assets/fonts/PlusJakartaSans_500Medium.ttf"),
    "PlusJakartaSans_600SemiBold": require("../assets/fonts/PlusJakartaSans_600SemiBold.ttf"),
    "PlusJakartaSans_700Bold": require("../assets/fonts/PlusJakartaSans_700Bold.ttf"),
  });

  useEffect(() => {
    initAuth();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={splashStyles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <RootNavigator />;
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});
