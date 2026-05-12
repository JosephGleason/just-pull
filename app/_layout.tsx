import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useAppContext } from "../src/context";
import { isOnboardingComplete } from "../src/storage";

function RootNavigator() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const { settings } = useAppContext();

  useEffect(() => {
    isOnboardingComplete().then(setOnboarded);
  }, [settings]);

  useEffect(() => {
    if (onboarded === null) return;
    if (!onboarded && segments[0] !== "onboarding") {
      router.replace("/onboarding");
    }
  }, [onboarded]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="workout"
        options={{ presentation: "fullScreenModal", gestureEnabled: false }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ presentation: "fullScreenModal", gestureEnabled: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProvider>
  );
}
