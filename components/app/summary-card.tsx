import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type Tone = 'default' | 'income' | 'expense';

interface SummaryCardProps {
  label: string;
  value: string;
  tone?: Tone;
}

export function SummaryCard({ label, value, tone = 'default' }: SummaryCardProps) {
  const { colors } = useAppTheme();

  const valueColor =
    tone === 'income' ? colors.income : tone === 'expense' ? colors.expense : colors.textPrimary;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
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
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
  },
});
