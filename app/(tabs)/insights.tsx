import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getInsightsSnapshot } from '@/data/local/insights-dashboard';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type InsightsSnapshot = Awaited<ReturnType<typeof getInsightsSnapshot>>;

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function comparePercentWidth(top: number, value: number): string {
  if (top <= 0) return '0%';
  return `${Math.max(6, Math.round((value / top) * 100))}%`;
}

function HorizontalBar({
  label,
  value,
  percent,
  fill,
  textColor,
  textMuted,
  trackColor,
}: {
  label: string;
  value: string;
  percent: string;
  fill: string;
  textColor: string;
  textMuted: string;
  trackColor: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: textMuted }}>{value} • {percent}</Text>
      </View>
      <View
        style={{
          height: 9,
          borderRadius: Radius.pill,
          backgroundColor: trackColor,
          overflow: 'hidden',
        }}>
        <View style={{ height: '100%', width: percent, borderRadius: Radius.pill, backgroundColor: fill }} />
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = createStyles(colors, insets.bottom);

  const [snapshot, setSnapshot] = useState<InsightsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInsightsSnapshot(new Date());
      setSnapshot(data);
    } catch {
      setError('Não foi possível carregar os insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );

  const incomeExpenseTop = useMemo(() => {
    if (!snapshot) return 0;
    return Math.max(snapshot.incomeVsExpense.income, snapshot.incomeVsExpense.expense);
  }, [snapshot]);

  const fixedVariableTop = useMemo(() => {
    if (!snapshot) return 0;
    return Math.max(snapshot.fixedVsVariable.fixed, snapshot.fixedVsVariable.variable);
  }, [snapshot]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Visão mensal direta, com foco no que importa.</Text>

        {loading || !snapshot ? (
          <View style={styles.card}><Text style={styles.cardText}>Carregando...</Text></View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Gastos por categoria</Text>
              <View style={styles.stack}>
                {snapshot.expensesByCategory.length === 0 ? (
                  <Text style={styles.cardText}>Sem gastos no mês.</Text>
                ) : (
                  snapshot.expensesByCategory.map((item) => (
                    <HorizontalBar
                      key={item.id}
                      label={item.label}
                      value={formatCurrency(item.amount)}
                      percent={formatPercent(item.share)}
                      fill={colors.primary}
                      textColor={colors.textPrimary}
                      textMuted={colors.textSecondary}
                      trackColor={colors.surfaceElevated}
                    />
                  ))
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Receitas vs gastos</Text>
              <View style={styles.stack}>
                <HorizontalBar
                  label="Receitas"
                  value={formatCurrency(snapshot.incomeVsExpense.income)}
                  percent={comparePercentWidth(incomeExpenseTop, snapshot.incomeVsExpense.income)}
                  fill={colors.success}
                  textColor={colors.textPrimary}
                  textMuted={colors.textSecondary}
                  trackColor={colors.surfaceElevated}
                />
                <HorizontalBar
                  label="Gastos"
                  value={formatCurrency(snapshot.incomeVsExpense.expense)}
                  percent={comparePercentWidth(incomeExpenseTop, snapshot.incomeVsExpense.expense)}
                  fill={colors.danger}
                  textColor={colors.textPrimary}
                  textMuted={colors.textSecondary}
                  trackColor={colors.surfaceElevated}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Fixos vs variáveis</Text>
              <View style={styles.stack}>
                <HorizontalBar
                  label="Fixos"
                  value={formatCurrency(snapshot.fixedVsVariable.fixed)}
                  percent={comparePercentWidth(fixedVariableTop, snapshot.fixedVsVariable.fixed)}
                  fill={colors.warning}
                  textColor={colors.textPrimary}
                  textMuted={colors.textSecondary}
                  trackColor={colors.surfaceElevated}
                />
                <HorizontalBar
                  label="Variáveis"
                  value={formatCurrency(snapshot.fixedVsVariable.variable)}
                  percent={comparePercentWidth(fixedVariableTop, snapshot.fixedVsVariable.variable)}
                  fill={colors.secondary}
                  textColor={colors.textPrimary}
                  textMuted={colors.textSecondary}
                  trackColor={colors.surfaceElevated}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Progresso da meta mensal</Text>
              <Text style={styles.metaText}>
                {snapshot.budgetProgress.target > 0
                  ? `${formatCurrency(snapshot.budgetProgress.spent)} de ${formatCurrency(snapshot.budgetProgress.target)}`
                  : 'Meta não definida'}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(snapshot.budgetProgress.progress * 100)}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Uso por forma de pagamento</Text>
              <View style={styles.stack}>
                {snapshot.paymentMethodUsage.length === 0 ? (
                  <Text style={styles.cardText}>Sem movimentações no mês.</Text>
                ) : (
                  snapshot.paymentMethodUsage.map((item) => (
                    <HorizontalBar
                      key={item.id}
                      label={item.label}
                      value={formatCurrency(item.amount)}
                      percent={formatPercent(item.share)}
                      fill={colors.textSecondary}
                      textColor={colors.textPrimary}
                      textMuted={colors.textSecondary}
                      trackColor={colors.surfaceElevated}
                    />
                  ))
                )}
              </View>
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
    title: {
      color: colors.textPrimary,
      fontSize: 30,
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
    stack: {
      gap: Spacing.sm,
    },
    metaText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    progressTrack: {
      height: 10,
      borderRadius: Radius.pill,
      overflow: 'hidden',
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: 1,
    },
    progressFill: {
      height: '100%',
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
  });
}
