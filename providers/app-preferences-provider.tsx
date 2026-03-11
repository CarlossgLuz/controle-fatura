import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { Colors, getColorTokens, type ThemeMode } from '@/constants/theme';
import {
  setLanguagePreference as persistLanguagePreference,
  setThemePreference as persistThemePreference,
  type AppLanguage,
  type ThemePreference,
} from '@/data/local/app-settings';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStrings, type AppStrings } from '@/locales/translations';

interface AppPreferencesContextValue {
  language: AppLanguage;
  setLanguagePreference: (value: AppLanguage) => Promise<void>;
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => Promise<void>;
}

interface AppPreferencesProviderProps {
  children: ReactNode;
  initialLanguage: AppLanguage;
  initialThemePreference: ThemePreference;
}

interface AppPreferencesState extends AppPreferencesContextValue {
  strings: AppStrings;
  mode: ThemeMode;
  colors: ReturnType<typeof getColorTokens>;
  legacyColors: (typeof Colors)[ThemeMode];
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({
  children,
  initialLanguage,
  initialThemePreference,
}: AppPreferencesProviderProps) {
  const [language, setLanguage] = useState<AppLanguage>(initialLanguage);
  const [themePreference, setTheme] = useState<ThemePreference>(initialThemePreference);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    setTheme(initialThemePreference);
  }, [initialThemePreference]);

  const setLanguagePreference = useCallback(async (value: AppLanguage) => {
    setLanguage(value);
    try {
      await persistLanguagePreference(value);
    } catch (error) {
      console.warn('Erro ao persistir idioma:', error);
    }
  }, []);

  const setThemePreference = useCallback(async (value: ThemePreference) => {
    setTheme(value);
    try {
      await persistThemePreference(value);
    } catch (error) {
      console.warn('Erro ao persistir tema:', error);
    }
  }, []);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      language,
      setLanguagePreference,
      themePreference,
      setThemePreference,
    }),
    [language, setLanguagePreference, setThemePreference, themePreference]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences(): AppPreferencesState {
  const context = useContext(AppPreferencesContext);
  const systemScheme = useColorScheme();
  const systemMode: ThemeMode = systemScheme === 'light' ? 'light' : 'dark';

  if (!context) {
    const fallbackLanguage: AppLanguage = 'pt-BR';
    const fallbackThemePreference: ThemePreference = 'system';
    const fallbackMode = systemMode;

    return {
      language: fallbackLanguage,
      strings: getStrings(fallbackLanguage),
      setLanguagePreference: async (_value: AppLanguage) => {},
      themePreference: fallbackThemePreference,
      setThemePreference: async (_value: ThemePreference) => {},
      mode: fallbackMode,
      colors: getColorTokens(fallbackMode),
      legacyColors: Colors[fallbackMode],
    };
  }

  const mode: ThemeMode = context.themePreference === 'system' ? systemMode : context.themePreference;

  return {
    ...context,
    strings: getStrings(context.language),
    mode,
    colors: getColorTokens(mode),
    legacyColors: Colors[mode],
  };
}
