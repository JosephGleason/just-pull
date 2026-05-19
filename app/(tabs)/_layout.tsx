import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { colors, fonts } from "../../src/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
        },
        tabBarShowLabel: true,
        tabBarIconStyle: { display: "none" },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarActiveBackgroundColor: "transparent",
        tabBarItemStyle: {
          borderRightWidth: 1,
          borderRightColor: colors.hairlineSoft,
          paddingTop: 12,
          paddingBottom: 11,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today" }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Prog" }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "Hist" }}
      />
      <Tabs.Screen
        name="body"
        options={{ title: "Body" }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "≡",
          tabBarLabelStyle: {
            fontFamily: fonts.mono,
            fontSize: 16,
            letterSpacing: 0,
            marginTop: -2,
          },
          tabBarItemStyle: {
            borderRightWidth: 0,
            paddingTop: 12,
            paddingBottom: 11,
          },
        }}
      />
    </Tabs>
  );
}
