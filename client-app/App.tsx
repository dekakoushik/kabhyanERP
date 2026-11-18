import React, { useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

// Prevent native splash screen from auto-hiding before authentication session is verified
SplashScreen.preventAutoHideAsync().catch(() => {});

class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(">>> [REACT_RENDER_CRASH]:", error);
    if (error && error.stack) {
      console.error(">>> [REACT_RENDER_CRASH_STACK]:\n" + error.stack);
    }
    if (errorInfo && errorInfo.componentStack) {
      console.error(">>> [COMPONENT_STACK]:\n" + errorInfo.componentStack);
    }
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Render Error</Text>
          <Text style={styles.errorMessage}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
          <ScrollView style={styles.stackBox}>
            <Text style={styles.stackText}>
              {String(this.state.error?.stack || "")}
            </Text>
            {this.state.errorInfo?.componentStack ? (
              <Text style={styles.componentStackText}>
                {String(this.state.errorInfo.componentStack)}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { loading } = useAuth();

  const [fontsLoaded, fontError] = useFonts({
    "GoogleSans-Regular": require("./assets/fonts/GoogleSans-Regular.ttf"),
    "GoogleSans-Medium": require("./assets/fonts/GoogleSans-Medium.ttf"),
    "GoogleSans-Bold": require("./assets/fonts/GoogleSans-Bold.ttf"),
  });

  const isReady = !loading && (fontsLoaded || Boolean(fontError));

  // Hide splash screen smoothly ONLY when the first frame of the app is laid out and fonts are ready
  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    // Keep native splash screen visible; avoids blank white flash, FOUT, or jumping spinner
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#991B1B",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#B91C1C",
    marginBottom: 16,
    fontWeight: "600",
  },
  stackBox: {
    maxHeight: 350,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  stackText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#374151",
    lineHeight: 16,
  },
  componentStackText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#6B7280",
    marginTop: 10,
    lineHeight: 16,
  },
});

