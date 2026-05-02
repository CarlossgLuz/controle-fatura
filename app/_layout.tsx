import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BootScreen } from '@/components/app';
import {
  detectDeviceLanguage,
  getResolvedLanguagePreference,
  getThemePreference,
  isOnboardingDone,
  type AppLanguage,
  type ThemePreference,
} from '@/data/local/app-settings';
import { initDatabase } from '@/data/sqlite';
import { useI18n } from '@/hooks/use-i18n';
import { useAppTheme } from '@/hooks/use-app-theme';
import { AppPreferencesProvider } from '@/providers/app-preferences-provider';
import { devWarn } from '@/utils/logger';

SplashScreen.preventAutoHideAsync().catch(() => {});

interface RootLayoutContentProps {
  appReady: boolean;
  bootstrapFailed: boolean;
  bootHold: boolean;
  nativeSplashHidden: boolean;
  onboardingReady: boolean;
  databaseReady: boolean;
  preferencesReady: boolean;
  databaseError: string | null;
}

function RootLayoutContent({
  appReady,
  bootstrapFailed,
  bootHold,
  nativeSplashHidden,
  onboardingReady,
  databaseReady,
  preferencesReady,
  databaseError,
}: RootLayoutContentProps) {
  const { mode, colors } = useAppTheme();
  const { strings } = useI18n();

  const bootStageLabel = !preferencesReady
    ? strings.boot.loadingPreferences
    : !databaseReady
      ? strings.boot.loadingDatabase
      : !onboardingReady
        ? strings.boot.loadingOnboarding
        : strings.boot.finishing;

  const shouldShowBoot = !appReady || !nativeSplashHidden || bootHold;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {bootstrapFailed && nativeSplashHidden ? (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}>
          <Text style={{ color: colors.expense, fontSize: 14, textAlign: 'center' }}>
            {__DEV__
              ? strings.layout.databaseInitError(databaseError ?? strings.common.unknownError)
              : strings.layout.databaseInitErrorGeneric}
          </Text>
        </View>
      ) : shouldShowBoot ? (
        <BootScreen title={strings.boot.preparing} subtitle={strings.boot.subtitle} stageLabel={bootStageLabel} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [language, setLanguage] = useState<AppLanguage>(() => detectDeviceLanguage());
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  const [bootHold, setBootHold] = useState(true);

  useEffect(() => {
    let cancelled = false;

    initDatabase()
      .then(() => {
        if (!cancelled) {
          setDatabaseReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'erro desconhecido';
          setDatabaseError(message);
          setDatabaseReady(false);
        }
        devWarn('Erro ao inicializar SQLite:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    isOnboardingDone()
      .then((done) => {
        if (cancelled) return;
        setOnboardingDoneState(done);
      })
      .catch((error) => {
        devWarn('Erro ao ler onboarding local:', error);
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
    let cancelled = false;

    Promise.all([getThemePreference(), getResolvedLanguagePreference()])
      .then(([savedTheme, savedLanguage]) => {
        if (cancelled) return;
        setThemePreference(savedTheme);
        setLanguage(savedLanguage);
      })
      .catch((error) => {
        devWarn('Erro ao carregar preferências locais:', error);
      })
      .finally(() => {
        if (!cancelled) {
          setPreferencesReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onboardingReady || !databaseReady) return;

    let cancelled = false;

    const syncRoute = async () => {
      const persistedOnboarding = await isOnboardingDone().catch(() => onboardingDone);
      if (cancelled) return;

      if (persistedOnboarding !== onboardingDone) {
        setOnboardingDoneState(persistedOnboarding);
      }

      const inOnboarding = segments[0] === 'onboarding';
      if (persistedOnboarding && inOnboarding) {
        router.replace('/(tabs)/inicio');
      }
    };

    void syncRoute();

    return () => {
      cancelled = true;
    };
  }, [databaseReady, onboardingDone, onboardingReady, router, segments]);

  const appReady = onboardingReady && databaseReady && preferencesReady && !databaseError;
  const bootstrapFailed = Boolean(databaseError) && onboardingReady && preferencesReady;
  const canHideNativeSplash = appReady || bootstrapFailed;

  useEffect(() => {
    if (!canHideNativeSplash || nativeSplashHidden) return;

    let cancelled = false;

    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        devWarn('Erro ao ocultar splash nativa:', error);
      } finally {
        if (!cancelled) {
          setNativeSplashHidden(true);
        }
      }
    };

    void hideNativeSplash();

    return () => {
      cancelled = true;
    };
  }, [canHideNativeSplash, nativeSplashHidden]);

  useEffect(() => {
    if (!appReady || !nativeSplashHidden) return;

    const timer = setTimeout(() => {
      setBootHold(false);
    }, 420);

    return () => clearTimeout(timer);
  }, [appReady, nativeSplashHidden]);

  return (
    <SafeAreaProvider>
      <AppPreferencesProvider
        initialLanguage={language}
        initialThemePreference={themePreference}
        onLanguageChange={setLanguage}
        onThemePreferenceChange={setThemePreference}>
        <RootLayoutContent
          appReady={appReady}
          bootstrapFailed={bootstrapFailed}
          bootHold={bootHold}
          nativeSplashHidden={nativeSplashHidden}
          onboardingReady={onboardingReady}
          databaseReady={databaseReady}
          preferencesReady={preferencesReady}
          databaseError={databaseError}
        />
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}
