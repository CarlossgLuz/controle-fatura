import { StyleSheet, Text, View } from 'react-native';

import { AppQuickSettings } from '@/components/app/app-quick-settings';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

export function AppHeader({ title, subtitle, eyebrow }: AppHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.main}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: colors.textMuted }]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
        <AppQuickSettings />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  main: {
    flex: 1,
    gap: Spacing.xs,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
