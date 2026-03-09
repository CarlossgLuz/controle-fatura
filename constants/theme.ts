import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  income: string;
  expense: string;
  warning: string;
  info: string;
  secondary: string;
  success: string;
  danger: string;
};

type LegacyColorShape = {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
} & ColorTokens;

const darkTokens: ColorTokens = {
  background: '#0B1220',
  surface: '#121A2A',
  surfaceElevated: '#1A2539',
  border: '#23324A',
  textPrimary: '#EAF0FA',
  textSecondary: '#B4C0D4',
  textMuted: '#8493AB',
  primary: '#3F7BF4',
  income: '#2FB67E',
  expense: '#E05B61',
  warning: '#D6A043',
  info: '#4B9BCF',
  secondary: '#D5DFF0',
  success: '#2FB67E',
  danger: '#E05B61',
};

const lightTokens: ColorTokens = {
  background: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF3FA',
  border: '#D9E2EF',
  textPrimary: '#142033',
  textSecondary: '#3A4B64',
  textMuted: '#6A7C97',
  primary: '#245FD2',
  income: '#157E5B',
  expense: '#C94149',
  warning: '#9E7420',
  info: '#2A79AD',
  secondary: '#22324A',
  success: '#157E5B',
  danger: '#C94149',
};

export const Colors: Record<ThemeMode, LegacyColorShape> = {
  light: {
    ...lightTokens,
    text: lightTokens.textPrimary,
    tint: lightTokens.primary,
    icon: lightTokens.textMuted,
    tabIconDefault: lightTokens.textMuted,
    tabIconSelected: lightTokens.primary,
  },
  dark: {
    ...darkTokens,
    text: darkTokens.textPrimary,
    tint: darkTokens.primary,
    icon: darkTokens.textMuted,
    tabIconDefault: darkTokens.textMuted,
    tabIconSelected: darkTokens.primary,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};

export function getColorTokens(mode: ThemeMode): ColorTokens {
  return mode === 'dark' ? darkTokens : lightTokens;
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
