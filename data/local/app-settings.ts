import AsyncStorage from 'expo-sqlite/kv-store';

export type ThemePreference = 'system' | 'light' | 'dark';
export type AppLanguage = 'pt-BR' | 'en' | 'es';

const ONBOARDING_KEY = 'finance.onboarding.completed.v1';
const THEME_PREFERENCE_KEY = 'clarium.theme.preference.v1';
const LANGUAGE_PREFERENCE_KEY = 'clarium.language.preference.v1';

function normalizeThemePreference(value: string | null): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  const locale = value?.toLowerCase() ?? '';
  if (locale.startsWith('pt')) return 'pt-BR';
  if (locale.startsWith('es')) return 'es';
  return 'en';
}

export async function isOnboardingDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === '1';
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}

export async function getThemePreference(): Promise<ThemePreference> {
  const raw = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
  return normalizeThemePreference(raw);
}

export async function setThemePreference(value: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, value);
}

export async function getStoredLanguagePreference(): Promise<AppLanguage | null> {
  const raw = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
  if (!raw) return null;
  return normalizeLanguage(raw);
}

export function detectDeviceLanguage(): AppLanguage {
  try {
    return normalizeLanguage(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'pt-BR';
  }
}

export async function getResolvedLanguagePreference(): Promise<AppLanguage> {
  const stored = await getStoredLanguagePreference();
  if (stored) return stored;
  return detectDeviceLanguage();
}

export async function setLanguagePreference(value: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, value);
}
