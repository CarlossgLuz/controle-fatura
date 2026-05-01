import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type Tone = 'default' | 'income' | 'expense' | 'warning' | 'info' | 'primary';

interface MetricCardProps {
  label: string;
  value: string;
  caption?: string;
  iconName?: IconSymbolName;
  tone?: Tone;
}

export function MetricCard({ label, value, caption, iconName, tone = 'default' }: MetricCardProps) {
  const { colors } = useAppTheme();
  const valueColor =
    tone === 'income'
      ? colors.income
      : tone === 'expense'
        ? colors.expense
        : tone === 'warning'
          ? colors.warning
          : tone === 'info'
            ? colors.info
            : tone === 'primary'
              ? colors.primary
              : colors.textPrimary;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        {iconName ? <IconSymbol name={iconName} size={16} color={colors.textMuted} /> : null}
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {caption ? <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  caption: {
    fontSize: 12,
  },
});
