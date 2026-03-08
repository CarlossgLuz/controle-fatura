import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
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
  background: '#070A13',
  surface: '#0F172A',
  surfaceElevated: '#111C33',
  primary: '#7DD3FC',
  secondary: '#F8FAFC',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: '#1E293B',
};

const lightTokens: ColorTokens = {
  background: '#F2F4F8',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  primary: '#0369A1',
  secondary: '#0F172A',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  border: '#CBD5E1',
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
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
};

export function getColorTokens(mode: ThemeMode): ColorTokens {
  return mode === 'dark' ? darkTokens : lightTokens;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
