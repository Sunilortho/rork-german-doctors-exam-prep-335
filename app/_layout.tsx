import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { UserProvider } from "@/contexts/UserContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.dark.background },
        headerTintColor: Colors.dark.text,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="voice-fsp"
        options={{
          title: "Voice FSP Simulation",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
      <Stack.Screen
        name="text-fsp"
        options={{
          title: "Text FSP Practice",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
      <Stack.Screen
        name="arztbrief-corrector"
        options={{
          title: "Arztbrief Auto-Corrector",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
      <Stack.Screen
        name="sample-viewer"
        options={{
          title: "Sample",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
      <Stack.Screen
        name="upgrade"
        options={{
          title: "Upgrade",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <DocumentsProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </DocumentsProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
