import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  canvas: string;
  surfaceV2: string;
  surfaceSubtle: string;
  scrim: string;
  border: string;
  borderSubtle: string;
  borderControl: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPrimaryV2: string;
  textSecondaryV2: string;
  textDisabled: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  actionPrimary: string;
  actionPrimaryPressed: string;
  onPrimaryAction: string;
  focusRing: string;
  income: string;
  expense: string;
  warning: string;
  info: string;
  positive: string;
  negative: string;
  positiveContainer: string;
  onPositiveContainer: string;
  negativeContainer: string;
  onNegativeContainer: string;
  warningContainer: string;
  onWarningContainer: string;
  infoContainer: string;
  onInfoContainer: string;
  shadow: string;
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
  surface: '#0F1826',
  surfaceElevated: '#172438',
  canvas: '#0E1116',
  surfaceV2: '#161B22',
  surfaceSubtle: '#202833',
  scrim: 'rgba(0, 0, 0, 0.72)',
  border: '#25354D',
  borderSubtle: '#3B4655',
  borderControl: '#687586',
  borderStrong: '#8795A8',
  textPrimary: '#EAF0FA',
  textSecondary: '#B4C0D4',
  textMuted: '#8493AB',
  textPrimaryV2: '#F4F7FA',
  textSecondaryV2: '#B6C0CC',
  textDisabled: '#7F8995',
  primary: '#2FB67E',
  primaryPressed: '#269668',
  onPrimary: '#FFFFFF',
  actionPrimary: '#9BB4FF',
  actionPrimaryPressed: '#B4C6FF',
  onPrimaryAction: '#0E1116',
  focusRing: '#9BB4FF',
  income: '#2FB67E',
  expense: '#E05B61',
  warning: '#D6A043',
  info: '#4B9BCF',
  positive: '#69D39D',
  negative: '#FF9B94',
  positiveContainer: '#153929',
  onPositiveContainer: '#8EE0B0',
  negativeContainer: '#44201F',
  onNegativeContainer: '#FFB4AE',
  warningContainer: '#3A2C13',
  onWarningContainer: '#FFD88A',
  infoContainer: '#17334A',
  onInfoContainer: '#9BD4FF',
  shadow: '#000000',
  secondary: '#D5DFF0',
  success: '#2FB67E',
  danger: '#E05B61',
};

const lightTokens: ColorTokens = {
  background: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceElevated: '#EDF3FA',
  canvas: '#F6F8FB',
  surfaceV2: '#FFFFFF',
  surfaceSubtle: '#EEF2F7',
  scrim: 'rgba(14, 17, 22, 0.64)',
  border: '#D9E2EF',
  borderSubtle: '#CBD5E1',
  borderControl: '#7A8796',
  borderStrong: '#52606D',
  textPrimary: '#142033',
  textSecondary: '#3A4B64',
  textMuted: '#6A7C97',
  textPrimaryV2: '#17202A',
  textSecondaryV2: '#52606D',
  textDisabled: '#7D8896',
  primary: '#1F9D68',
  primaryPressed: '#157E5B',
  onPrimary: '#FFFFFF',
  actionPrimary: '#2457D6',
  actionPrimaryPressed: '#1945B4',
  onPrimaryAction: '#FFFFFF',
  focusRing: '#2457D6',
  income: '#157E5B',
  expense: '#C94149',
  warning: '#9E7420',
  info: '#2A79AD',
  positive: '#146C43',
  negative: '#B42318',
  positiveContainer: '#E7F6ED',
  onPositiveContainer: '#0E5A35',
  negativeContainer: '#FDECEA',
  onNegativeContainer: '#912018',
  warningContainer: '#FFF4D6',
  onWarningContainer: '#674000',
  infoContainer: '#E8F2FF',
  onInfoContainer: '#174E8C',
  shadow: '#000000',
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
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  touchTarget: 48,
};

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
  control: 12,
  card: 16,
  sheet: 24,
  full: 999,
};

export const Dimensions = {
  minTouchTarget: 48,
  buttonHeight: 48,
  largeButtonHeight: 56,
  fabSize: 56,
  iconSize: 24,
};

export const Typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
  title1: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  title2: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '500' as const },
};

export const Motion = {
  durationFast: 140,
  durationStandard: 200,
  durationSheet: 240,
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
