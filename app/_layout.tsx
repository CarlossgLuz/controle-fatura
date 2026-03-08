import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isOnboardingDone } from '@/data/local/app-settings';
import { initDatabase } from '@/data/sqlite';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function RootLayout() {
  const { mode, colors } = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [onboardingDone, setOnboardingDoneState] = useState(false);

  useEffect(() => {
    initDatabase().catch((error) => {
      console.warn('Erro ao inicializar SQLite:', error);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    isOnboardingDone()
      .then((done) => {
        if (cancelled) return;
        setOnboardingDoneState(done);
      })
      .catch((error) => {
        console.warn('Erro ao ler onboarding local:', error);
      })
      .finally(() => {
        if (!cancelled) {
          setOnboardingReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onboardingReady) return;

    const inOnboarding = segments[0] === 'onboarding';
    if (!onboardingDone && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (onboardingDone && inOnboarding) {
      router.replace('/(tabs)/inicio');
    }
  }, [onboardingDone, onboardingReady, router, segments]);

  if (!onboardingReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
