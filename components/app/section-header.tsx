import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  iconName?: IconSymbolName;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, subtitle, iconName, actionLabel, onActionPress }: SectionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.mainRow}>
        {iconName ? <IconSymbol name={iconName} size={16} color={colors.textSecondary} /> : null}
        <View style={styles.main}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress}>
          <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
  action: {
    fontSize: 13,
    fontWeight: '700',
  },
});
