import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getHomeDashboardSnapshot } from '@/data/local/home-dashboard';
import {
  AppHeader,
  AppScreen,
  EmptyState,
  MetricCard,
  ProgressCard,
  SectionHeader,
  SummaryCard,
  TransactionListItem,
} from '@/components/app';
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

function signedAmount(kind: 'income' | 'expense', amount: number): string {
  return `${kind === 'income' ? '+' : '-'} ${formatCurrency(amount)}`;
}

export default function InicioScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getHomeDashboardSnapshot(new Date());
      setSnapshot(data);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'erro desconhecido';
      setError(`Não foi possível carregar os dados de início (${message}).`);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const monthTone = !snapshot ? 'default' : snapshot.monthBalance >= 0 ? 'income' : 'expense';

  return (
    <AppScreen>
      <AppHeader
        eyebrow="Visão mensal"
        title="Início"
        subtitle="Resumo direto do mês, sem ruído visual."
      />

      {loading && !snapshot ? (
        <View style={styles.cardLoading}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando dados...</Text>
        </View>
      ) : null}

      {!loading && error && !snapshot ? (
        <EmptyState
          title="Falha ao carregar"
          description="Não conseguimos buscar os dados do mês agora."
          actionLabel="Tentar novamente"
          onActionPress={loadDashboard}
        />
      ) : null}

      {snapshot ? (
        <>
          <SummaryCard
            label={`Saldo de ${snapshot.monthLabel}`}
            value={formatCurrency(snapshot.monthBalance)}
            tone={monthTone}
          />

          <View style={styles.row}>
            <MetricCard label="Entradas" value={formatCurrency(snapshot.monthIncome)} />
            <MetricCard label="Saídas" value={formatCurrency(snapshot.monthExpense)} />
          </View>

          <View style={styles.row}>
            <MetricCard label="Fixos do mês" value={formatCurrency(snapshot.monthFixedExpense)} />
            <MetricCard label="Fatura atual" value={formatCurrency(snapshot.currentCardInvoice)} />
          </View>

          <ProgressCard
            title="Meta mensal"
            subtitle={
              snapshot.budgetTarget > 0
                ? `${formatCurrency(snapshot.monthExpense)} de ${formatCurrency(snapshot.budgetTarget)}`
                : 'Defina uma meta no Planejamento para acompanhar.'
            }
            progress={snapshot.budgetProgress}
          />

          <View style={styles.sectionCard}>
            <SectionHeader title="Últimos lançamentos" subtitle="Movimentações recentes do mês" />

            {snapshot.recentMovements.length === 0 ? (
              <EmptyState
                title="Sem movimentações"
                description="Use a aba Lançar para registrar a primeira receita ou gasto."
              />
            ) : (
              <View style={styles.list}>
                {snapshot.recentMovements.map((item) => (
                  <TransactionListItem
                    key={item.id}
                    title={item.title}
                    meta={formatDate(item.date)}
                    amount={signedAmount(item.kind, item.amount)}
                    kind={item.kind}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      ) : null}

      {error && snapshot ? (
        <Pressable onPress={loadDashboard} style={styles.retryInline}>
          <Text style={[styles.retryText, { color: colors.info }]}>Atualizar dados</Text>
        </Pressable>
      ) : null}
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    list: {
      gap: Spacing.sm,
    },
    cardLoading: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      backgroundColor: colors.surface,
      padding: Spacing.lg,
    },
    loadingText: {
      fontSize: 14,
    },
    retryInline: {
      alignSelf: 'center',
      paddingVertical: Spacing.xs,
    },
    retryText: {
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
