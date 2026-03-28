import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { ThemedDialogProvider } from "@/components/ThemedDialog";
import LanguageDetector from "@/components/LanguageDetector";
import { ToastContainer } from "@/components/Toast";
import { LinearGradient } from 'expo-linear-gradient';
import { registerBackgroundFetchAsync } from '@/services/backgroundTasks';
import "@/i18n";
import { useTranslation } from 'react-i18next';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AppSplashOverlay() {
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [opacity, rotate]);

  const rotateDeg = useMemo(() => rotate.interpolate({ inputRange: [0,1], outputRange: ['0deg','360deg'] }), [rotate]);

  return (
    <LinearGradient colors={["#27AE60", "#1F8E4D"]} style={StyleSheet.absoluteFillObject}>
      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity }} testID="splash-overlay">
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.5 }}>Moto Fast</Text>
        <Animated.View style={{ position: 'absolute', bottom: 80, transform: [{ rotate: rotateDeg }] }}>
          <View style={{ width: 54, height: 54, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', top: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />
            <View style={{ position: 'absolute', left: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ECC71' }} />
            <View style={{ position: 'absolute', right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8F5E9' }} />
          </View>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [isDark]);

  return (
    <View style={{ flex: 1 }} testID="root-layout-bg">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}
        accessibilityLabel="theme-fade-overlay"
      />
      <Stack screenOptions={{ headerBackTitle: t('common.back') }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="map-home" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
        <Stack.Screen name="kyc-status" options={{ presentation: 'card' }} />
        <Stack.Screen name="verify-pending" options={{ presentation: 'card', title: 'Verifique seu e-mail' }} />
      </Stack>
    </View>
  );
}

function AppShell() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const auth = useAuth() as ReturnType<typeof useAuth> | undefined;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const isLoading = !auth || auth?.isLoading;

  useEffect(() => {
    const t = setTimeout(() => {
      setShowSplash(false);
      if (!isAuthenticated) {
        router.replace('/map-home');
      }
      SplashScreen.hideAsync();
    }, 2000);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && Platform.OS !== 'web') {
      registerBackgroundFetchAsync().catch((err) => {
        console.error('Failed to register background fetch:', err);
      });
    }
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1 }}>
      <RootLayoutNav />
      {(showSplash || isLoading) && <AppSplashOverlay />}
      {isLoading && (
        <View style={{ ...StyleSheet.absoluteFillObject as any, alignItems: 'center', justifyContent: 'center' }} testID="auth-loading">
          <Text style={{ color: '#fff' }}>Carregando...</Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <OrdersProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemedDialogProvider>
                  <LanguageDetector />
                  <AppShell />
                  <ToastContainer />
                </ThemedDialogProvider>
              </GestureHandlerRootView>
            </OrdersProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
