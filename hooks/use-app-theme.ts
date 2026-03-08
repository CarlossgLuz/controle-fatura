import { Colors, getColorTokens, type ThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const mode: ThemeMode = systemScheme === 'light' ? 'light' : 'dark';

  return {
    mode,
    colors: getColorTokens(mode),
    legacyColors: Colors[mode],
  };
}
