import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ProgressCardProps {
  title: string;
  subtitle: string;
  progress: number;
}

export function ProgressCard({ title, subtitle, progress }: ProgressCardProps) {
  const { colors } = useAppTheme();
  const width = `${Math.round(Math.max(0, Math.min(progress, 1)) * 100)}%`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
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
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
  track: {
    height: 10,
    borderWidth: 1,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
