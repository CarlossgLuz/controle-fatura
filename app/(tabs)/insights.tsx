import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = createStyles(colors, insets.bottom);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Leitura simples para leigos, com visão mensal.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo visual</Text>
          <Text style={styles.cardText}>Estrutura preparada para indicadores de receitas x gastos fixos.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], bottomInset: number) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: bottomInset + Spacing.xxl,
      gap: Spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
  });
}
