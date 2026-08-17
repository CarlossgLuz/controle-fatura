import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dimensions, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({ title, description, actionLabel, onActionPress }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: pressed ? colors.actionPrimaryPressed : colors.actionPrimary },
          ]}
          onPress={onActionPress}>
          <Text style={[styles.actionText, { color: colors.onPrimaryAction }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  action: {
    minHeight: Dimensions.buttonHeight,
    minWidth: Dimensions.minTouchTarget,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  actionText: {
    ...Typography.label,
  },
});
