import { Stack } from "expo-router";
import { AppProvider } from "../src/context";

export default function RootLayout() {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}
