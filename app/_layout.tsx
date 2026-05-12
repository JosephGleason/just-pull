import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useAppContext } from "../src/context";

function RootNavigator() {
  const { settings, isLoading } = useAppContext();

  if (isLoading) return null;

  if (!settings) {
    return (
      <>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="workout"
          options={{ presentation: "fullScreenModal", gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
