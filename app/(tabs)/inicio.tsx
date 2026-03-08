import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHomeDashboardSnapshot } from '@/data/local/home-dashboard';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type HomeSnapshot = Awaited<ReturnType<typeof getHomeDashboardSnapshot>>;

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function progressPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = createStyles(colors, insets.bottom);

  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getHomeDashboardSnapshot(new Date());
      setSnapshot(data);
    } catch {
      setError('Não foi possível carregar os dados da home.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const saldoColor = useMemo(() => {
    if (!snapshot) {
      return colors.textPrimary;
    }

    return snapshot.monthBalance >= 0 ? colors.success : colors.danger;
  }, [colors.danger, colors.success, colors.textPrimary, snapshot]);

  const progressWidth = useMemo(() => {
    if (!snapshot) {
      return '0%';
    }

    return `${Math.round(snapshot.budgetProgress * 100)}%`;
  }, [snapshot]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Visão geral</Text>
        <Text style={styles.title}>Início</Text>
        <Text style={styles.subtitle}>Leitura rápida do mês atual.</Text>

        {loading || !snapshot ? (
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Carregando...</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Saldo do mês</Text>
              <Text style={[styles.heroValue, { color: saldoColor }]}>
                {formatCurrency(snapshot.monthBalance)}
              </Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Receitas do mês</Text>
                <Text style={styles.cardValue}>{formatCurrency(snapshot.monthIncome)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Gastos do mês</Text>
                <Text style={styles.cardValue}>{formatCurrency(snapshot.monthExpense)}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Fixos do mês</Text>
                <Text style={styles.cardValue}>{formatCurrency(snapshot.monthFixedExpense)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Fatura atual</Text>
                <Text style={styles.cardValue}>{formatCurrency(snapshot.currentCardInvoice)}</Text>
              </View>
            </View>

            <View style={styles.cardFull}>
              <View style={styles.progressHeader}>
                <Text style={styles.cardLabel}>Meta mensal</Text>
                <Text style={styles.progressText}>
                  {snapshot.budgetTarget > 0
                    ? `${progressPercent(snapshot.budgetProgress)} de ${formatCurrency(snapshot.budgetTarget)}`
                    : 'Meta não definida'}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>

            <View style={styles.cardFull}>
              <Text style={styles.sectionTitle}>Últimas movimentações</Text>
              {snapshot.recentMovements.length === 0 ? (
                <Text style={styles.emptyText}>Sem movimentações recentes.</Text>
              ) : (
                <View style={styles.list}>
                  {snapshot.recentMovements.map((item) => (
                    <View key={item.id} style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <Text style={styles.listTitle}>{item.title}</Text>
                        <Text style={styles.listMeta}>{formatDate(item.date)}</Text>
                      </View>
                      <Text
                        style={[
                          styles.listAmount,
                          { color: item.kind === 'income' ? colors.success : colors.textPrimary },
                        ]}>
                        {item.kind === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      gap: Spacing.xs,
    },
    heroLabel: {
      color: colors.textMuted,
      fontSize: 13,
    },
    heroValue: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.textPrimary,
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
    cardFull: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
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
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    progressText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    progressTrack: {
      height: 10,
      borderRadius: Radius.pill,
      overflow: 'hidden',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    list: {
      gap: Spacing.sm,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    listItemLeft: {
      flex: 1,
      gap: 2,
    },
    listTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    listMeta: {
      color: colors.textMuted,
      fontSize: 12,
    },
    listAmount: {
      fontSize: 14,
      fontWeight: '700',
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
  });
}
