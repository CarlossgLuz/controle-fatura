import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type Tone = 'default' | 'income' | 'expense';

interface SummaryCardProps {
  label: string;
  value: string;
  tone?: Tone;
  iconName?: IconSymbolName;
}

function withAlpha(color: string, alpha: string): string {
  return /^#([A-Fa-f0-9]{6})$/.test(color) ? `${color}${alpha}` : color;
}

export function SummaryCard({ label, value, tone = 'default', iconName }: SummaryCardProps) {
  const { colors } = useAppTheme();

  const valueColor =
    tone === 'income' ? colors.income : tone === 'expense' ? colors.expense : colors.textPrimary;
  const strongTone = tone === 'income';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: strongTone ? withAlpha(colors.income, '10') : colors.surface,
          borderColor: strongTone ? withAlpha(colors.income, '44') : colors.border,
        },
      ]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        {iconName ? <IconSymbol name={iconName} size={18} color={strongTone ? colors.income : colors.textMuted} /> : null}
      </View>
      <Text style={[styles.value, strongTone && styles.valueStrong, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
  },
  valueStrong: {
    fontWeight: '800',
  },
});
