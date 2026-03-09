import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getInsightsSnapshot } from '@/data/local/insights-dashboard';
import { AppHeader, AppScreen, EmptyState, ProgressCard, SectionHeader } from '@/components/app';
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

export default function InsightsScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const [snapshot, setSnapshot] = useState<InsightsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInsightsSnapshot(new Date());
      setSnapshot(data);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'erro desconhecido';
      setError(`Não foi possível carregar os insights (${message}).`);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );

  const BarItem = ({
    label,
    value,
    share,
    color,
  }: {
    label: string;
    value: number;
    share: number;
    color: string;
  }) => (
    <View style={styles.barBlock}>
      <View style={styles.barTop}>
        <Text style={[styles.barLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.barValue, { color: colors.textSecondary }]}>
          {formatCurrency(value)} · {formatPercent(share)}
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={[styles.barFill, { width: `${Math.max(share * 100, 4)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <AppScreen>
      <AppHeader
        eyebrow="Leitura analítica"
        title="Insights"
        subtitle="Comparativos simples para decidir próximos ajustes."
      />

      {loading && !snapshot ? (
        <View style={styles.loadingCard}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando insights...</Text>
        </View>
      ) : null}

      {!loading && error && !snapshot ? (
        <EmptyState
          title="Falha ao carregar"
          description="Não foi possível montar os insights neste momento."
          actionLabel="Tentar novamente"
          onActionPress={loadInsights}
        />
      ) : null}

      {snapshot && !snapshot.hasAnyData ? (
        <EmptyState
          title="Sem dados suficientes"
          description="Registre receitas e gastos na aba Lançar para liberar estes insights."
        />
      ) : null}

      {snapshot && snapshot.hasAnyData ? (
        <>
          <View style={styles.card}>
            <SectionHeader title="Receitas vs gastos" subtitle="Equilíbrio mensal" />
            <BarItem
              label="Receitas"
              value={snapshot.incomeVsExpense.income}
              share={
                snapshot.incomeVsExpense.income + snapshot.incomeVsExpense.expense > 0
                  ? snapshot.incomeVsExpense.income /
                    (snapshot.incomeVsExpense.income + snapshot.incomeVsExpense.expense)
                  : 0
              }
              color={colors.income}
            />
            <BarItem
              label="Gastos"
              value={snapshot.incomeVsExpense.expense}
              share={
                snapshot.incomeVsExpense.income + snapshot.incomeVsExpense.expense > 0
                  ? snapshot.incomeVsExpense.expense /
                    (snapshot.incomeVsExpense.income + snapshot.incomeVsExpense.expense)
                  : 0
              }
              color={colors.expense}
            />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Gastos por categoria" subtitle="Categorias com maior peso" />
            {snapshot.expensesByCategory.length === 0 ? (
              <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Sem gastos no mês.</Text>
            ) : (
              snapshot.expensesByCategory.map((item) => (
                <BarItem
                  key={item.id}
                  label={item.label}
                  value={item.amount}
                  share={item.share}
                  color={colors.primary}
                />
              ))
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader title="Fixos vs variáveis" subtitle="Composição dos gastos" />
            <BarItem
              label="Fixos"
              value={snapshot.fixedVsVariable.fixed}
              share={
                snapshot.fixedVsVariable.fixed + snapshot.fixedVsVariable.variable > 0
                  ? snapshot.fixedVsVariable.fixed /
                    (snapshot.fixedVsVariable.fixed + snapshot.fixedVsVariable.variable)
                  : 0
              }
              color={colors.warning}
            />
            <BarItem
              label="Variáveis"
              value={snapshot.fixedVsVariable.variable}
              share={
                snapshot.fixedVsVariable.fixed + snapshot.fixedVsVariable.variable > 0
                  ? snapshot.fixedVsVariable.variable /
                    (snapshot.fixedVsVariable.fixed + snapshot.fixedVsVariable.variable)
                  : 0
              }
              color={colors.info}
            />
          </View>

          <ProgressCard
            title="Progresso da meta"
            subtitle={
              snapshot.budgetProgress.target > 0
                ? `${formatCurrency(snapshot.budgetProgress.spent)} de ${formatCurrency(snapshot.budgetProgress.target)}`
                : 'Meta mensal não definida no Planejamento.'
            }
            progress={snapshot.budgetProgress.progress}
          />

          <View style={styles.card}>
            <SectionHeader title="Forma de pagamento" subtitle="Onde você mais concentra gastos" />
            {snapshot.paymentMethodUsage.length === 0 ? (
              <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Sem movimentações no mês.</Text>
            ) : (
              snapshot.paymentMethodUsage.map((item) => (
                <BarItem
                  key={item.id}
                  label={item.label}
                  value={item.amount}
                  share={item.share}
                  color={colors.textSecondary}
                />
              ))
            )}
          </View>
        </>
      ) : null}

      {error && snapshot ? (
        <Text style={[styles.inlineError, { color: colors.warning }]}>Dados podem estar desatualizados.</Text>
      ) : null}
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    placeholder: {
      fontSize: 13,
    },
    loadingCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.lg,
    },
    loadingText: {
      fontSize: 14,
    },
    inlineError: {
      alignSelf: 'center',
      fontSize: 12,
    },
    barBlock: {
      gap: Spacing.xs,
    },
    barTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    barLabel: {
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    barValue: {
      fontSize: 12,
      fontWeight: '600',
    },
    barTrack: {
      height: 9,
      borderRadius: Radius.pill,
      borderWidth: 1,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: Radius.pill,
    },
  });
}
