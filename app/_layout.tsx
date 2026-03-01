import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { UserProvider } from "@/contexts/UserContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { DemoProvider } from "@/contexts/DemoContext";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";

console.log('[RootLayout] Module loaded');

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function DemoGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

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
      <Stack.Screen
        name="demo-expired"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
      <Stack.Screen
        name="help-faq"
        options={{
          title: 'Help & FAQ',
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
      <Stack.Screen
        name="terms-privacy"
        options={{
          title: 'Terms & Privacy',
          headerStyle: { backgroundColor: Colors.dark.surface },
        }}
      />
    </Stack>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('[ErrorBoundary] Caught error:', error);
    console.log('[ErrorBoundary] Error stack:', error.stack);
    console.log('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo: errorInfo.componentStack || '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={layoutStyles.errorContainer}>
          <Text style={layoutStyles.errorTitle}>Something went wrong</Text>
          <Text style={layoutStyles.errorMessage}>{this.state.error?.message || 'Unknown error'}</Text>
          <ScrollView style={layoutStyles.errorStack}>
            <Text style={layoutStyles.errorStackText}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const layoutStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  errorStack: {
    maxHeight: 200,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 8,
  },
  errorStackText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontFamily: 'monospace',
  },
});

export default function RootLayout() {
  console.log('[RootLayout] Rendering');

  useEffect(() => {
    console.log('[RootLayout] useEffect - hiding splash');
    SplashScreen.hideAsync().catch(e => console.log('[RootLayout] Splash hide error:', e));
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <DemoProvider>
              <UserProvider>
                <DocumentsProvider>
                  <StatusBar style="light" />
                  <DemoGate>
                    <RootLayoutNav />
                  </DemoGate>
                </DocumentsProvider>
              </UserProvider>
            </DemoProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
