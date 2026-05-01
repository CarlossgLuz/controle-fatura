import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface BootScreenProps {
  title: string;
  subtitle: string;
  stageLabel: string;
}

export function BootScreen({ title, subtitle, stageLabel }: BootScreenProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 780,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 780,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    <View style={styles.screen}>
      <View style={styles.brandWrap}>
        <View style={styles.brandRing}>
          <Text style={styles.brandLetter}>C</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.progressRow}>
        <Animated.View style={[styles.dot, { opacity: pulse }]} />
        <Text style={styles.stageLabel}>{stageLabel}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    brandWrap: {
      marginBottom: Spacing.sm,
    },
    brandRing: {
      width: 68,
      height: 68,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: `${colors.primary}66`,
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandLetter: {
      color: colors.primary,
      fontSize: 30,
      fontWeight: '800',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
    },
    progressRow: {
      marginTop: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: 8,
      paddingHorizontal: Spacing.md,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: Radius.pill,
      backgroundColor: colors.primary,
    },
    stageLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });
}
