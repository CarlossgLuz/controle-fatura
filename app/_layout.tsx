import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from '@/data/sqlite';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function RootLayout() {
  const { mode, colors } = useAppTheme();

  useEffect(() => {
    initDatabase().catch((error) => {
      console.warn('Erro ao inicializar SQLite:', error);
    });
  }, []);

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
