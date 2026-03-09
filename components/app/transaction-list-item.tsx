import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface TransactionListItemProps {
  title: string;
  meta: string;
  amount: string;
  kind: 'income' | 'expense';
}

export function TransactionListItem({ title, meta, amount, kind }: TransactionListItemProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={styles.main}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{meta}</Text>
      </View>
      <Text
        style={[
          styles.amount,
          {
            color: kind === 'income' ? colors.income : colors.expense,
          },
        ]}>
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  main: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
