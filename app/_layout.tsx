import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { AppProvider, useAppContext } from "../src/context";
import { colors } from "../src/theme";

function RootNavigator() {
  const { settings, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <View style={splashStyles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {!settings ? (
          <Stack.Screen name="onboarding" />
        ) : (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="workout"
              options={{ presentation: "fullScreenModal", gestureEnabled: false }}
            />
          </>
        )}
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

  if (!fontsLoaded) {
    return (
      <View style={splashStyles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});
