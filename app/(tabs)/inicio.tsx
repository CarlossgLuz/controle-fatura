import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = createStyles(colors, insets.bottom);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Visão geral</Text>
        <Text style={styles.title}>Início</Text>
        <Text style={styles.subtitle}>Resumo simples do mês para acompanhar sem complicação.</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Fatura atual</Text>
          <Text style={styles.heroValue}>R$ 0,00</Text>
          <Text style={styles.heroMeta}>Fechamento e vencimento serão exibidos aqui.</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Receitas</Text>
            <Text style={styles.cardValue}>R$ 0,00</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Gastos fixos</Text>
            <Text style={styles.cardValue}>R$ 0,00</Text>
          </View>
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
    eyebrow: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '700',
      marginTop: -2,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      maxWidth: 340,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    heroLabel: {
      color: colors.textMuted,
      fontSize: 13,
    },
    heroValue: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '700',
    },
    heroMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    grid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    cardLabel: {
      color: colors.textMuted,
      fontSize: 12,
    },
    cardValue: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
  });
}
