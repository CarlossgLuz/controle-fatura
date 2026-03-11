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
import { useI18n } from '@/hooks/use-i18n';

type HomeSnapshot = Awaited<ReturnType<typeof getHomeDashboardSnapshot>>;

export default function InicioScreen() {
  const { colors } = useAppTheme();
  const { strings, formatCurrency, formatIsoDate, resolveSignedAmount } = useI18n();
  const styles = createStyles(colors);

  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    console.info('[inicio] loadDashboard:start');
    setLoading(true);
    setError(null);

    try {
      const data = await getHomeDashboardSnapshot(new Date());
      setSnapshot(data);
      console.info('[inicio] loadDashboard:ok', {
        monthKey: data.monthKey,
        movements: data.recentMovements.length,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : strings.common.unknownError;
      console.warn('[inicio] loadDashboard:error', message);
      setError(strings.home.loadError(message));
    } finally {
      setLoading(false);
    }
  }, [strings.common.unknownError, strings.home]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const monthTone = !snapshot ? 'default' : snapshot.monthBalance >= 0 ? 'income' : 'expense';

  return (
    <AppScreen>
      <AppHeader
        eyebrow={strings.home.eyebrow}
        title={strings.home.title}
        subtitle={strings.home.subtitle}
      />

      {loading && !snapshot ? (
        <View style={styles.cardLoading}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{strings.home.loading}</Text>
        </View>
      ) : null}

      {!loading && error && !snapshot ? (
        <EmptyState
          title={strings.home.loadFailedTitle}
          description={strings.home.loadFailedDescription}
          actionLabel={strings.common.tryAgain}
          onActionPress={loadDashboard}
        />
      ) : null}

      {snapshot ? (
        <>
          <SummaryCard
            label={strings.home.monthBalanceLabel(snapshot.monthLabel)}
            value={formatCurrency(snapshot.monthBalance)}
            tone={monthTone}
            iconName="dollarsign.circle.fill"
          />

          <View style={styles.row}>
            <MetricCard
              label={strings.home.income}
              value={formatCurrency(snapshot.monthIncome)}
              iconName="plus.circle.fill"
              tone="income"
            />
            <MetricCard
              label={strings.home.expense}
              value={formatCurrency(snapshot.monthExpense)}
              iconName="minus.circle.fill"
              tone="expense"
            />
          </View>

          <View style={styles.row}>
            <MetricCard
              label={strings.home.fixedMonth}
              value={formatCurrency(snapshot.monthFixedExpense)}
              iconName="pin.fill"
              tone="warning"
            />
            <MetricCard
              label={strings.home.currentInvoice}
              value={formatCurrency(snapshot.currentCardInvoice)}
              iconName="creditcard.fill"
              tone="info"
            />
          </View>

          <View style={styles.sectionCard}>
            <SectionHeader
              title={strings.home.cardCycleTitle}
              subtitle={strings.home.cardCycleSubtitle}
              iconName="creditcard.fill"
            />
            <View style={styles.cycleRow}>
              <View style={styles.cycleCol}>
                <Text style={[styles.cycleLabel, { color: colors.textMuted }]}>{strings.home.closing}</Text>
                <Text style={[styles.cycleValue, { color: colors.textPrimary }]}>
                  {formatIsoDate(snapshot.cardCycleClosing)}
                </Text>
              </View>
              <View style={styles.cycleCol}>
                <Text style={[styles.cycleLabel, { color: colors.textMuted }]}>{strings.home.due}</Text>
                <Text style={[styles.cycleValue, { color: colors.textPrimary }]}>
                  {formatIsoDate(snapshot.cardCycleDue)}
                </Text>
              </View>
            </View>
          </View>

          <ProgressCard
            title={strings.home.budgetTitle}
            subtitle={
              snapshot.budgetTarget > 0
                ? strings.home.budgetProgress(
                    formatCurrency(snapshot.monthExpense),
                    formatCurrency(snapshot.budgetTarget)
                  )
                : strings.home.budgetNoTarget
            }
            progress={snapshot.budgetProgress}
            iconName="target"
          />

          <View style={styles.sectionCard}>
            <SectionHeader
              title={strings.home.recentTitle}
              subtitle={strings.home.recentSubtitle}
              iconName="info.circle.fill"
            />

            {snapshot.recentMovements.length === 0 ? (
              <EmptyState
                title={strings.home.emptyMovementsTitle}
                description={strings.home.emptyMovementsDescription}
              />
            ) : (
              <View style={styles.list}>
                {snapshot.recentMovements.map((item) => (
                  <TransactionListItem
                    key={item.id}
                    title={item.title}
                    meta={formatIsoDate(item.date)}
                    amount={resolveSignedAmount(item.kind, item.amount)}
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
          <Text style={[styles.retryText, { color: colors.info }]}>{strings.home.refreshData}</Text>
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
    cycleRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    cycleCol: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.sm,
      paddingVertical: 10,
      paddingHorizontal: Spacing.sm,
      gap: 2,
      backgroundColor: colors.surfaceElevated,
    },
    cycleLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    cycleValue: {
      fontSize: 14,
      fontWeight: '700',
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
