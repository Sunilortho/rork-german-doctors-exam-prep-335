import { Tabs } from "expo-router";
import { Map, FileText, Mic, Sparkles, User, BookOpen } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.dark.surface,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 16,
          height: Platform.OS === 'ios' ? 88 : 72,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Roadmap",
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="fsp-practice"
        options={{
          title: "FSP Practice",
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="begriffe"
        options={{
          title: "Begriffe",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
