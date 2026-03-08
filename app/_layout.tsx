import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { initDatabase } from '@/data/sqlite';

export default function RootLayout() {
  useEffect(() => {
    initDatabase().catch((error) => {
      console.warn('Erro ao inicializar SQLite:', error);
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#070A13' },
          animation: 'fade',
        }}
      />
    </>
  );
}
