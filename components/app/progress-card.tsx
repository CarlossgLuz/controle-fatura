import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ProgressCardProps {
  title: string;
  subtitle: string;
  progress: number;
  iconName?: IconSymbolName;
}

export function ProgressCard({ title, subtitle, progress, iconName }: ProgressCardProps) {
  const { colors } = useAppTheme();
  const width = `${Math.round(Math.max(0, Math.min(progress, 1)) * 100)}%` as const;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {iconName ? <IconSymbol name={iconName} size={16} color={colors.textSecondary} /> : null}
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={[styles.fill, { width, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
