import { useAppPreferences } from '@/providers/app-preferences-provider';

export function useAppTheme() {
  const { mode, colors, legacyColors, themePreference, setThemePreference } = useAppPreferences();

  return {
    mode,
    colors,
    legacyColors,
    themePreference,
    setThemePreference,
  };
}
