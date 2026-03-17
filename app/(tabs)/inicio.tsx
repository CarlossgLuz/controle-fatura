import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import {
  removeTransactionById,
  removeTransactionsByInstallmentGroupFromCurrent,
} from '@/data/local/finance-repository';
import { excluirCompra } from '@/data/sqlite';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useI18n } from '@/hooks/use-i18n';
import { devInfo, devWarn } from '@/utils/logger';

type HomeSnapshot = Awaited<ReturnType<typeof getHomeDashboardSnapshot>>;

export default function InicioScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { strings, formatCurrency, formatIsoDate, resolveSignedAmount } = useI18n();
  const styles = createStyles(colors);

  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    devInfo('[inicio] loadDashboard:start');
    setLoading(true);
    setError(null);

    try {
      const data = await getHomeDashboardSnapshot(new Date());
      setSnapshot(data);
      devInfo('[inicio] loadDashboard:ok', {
        monthKey: data.monthKey,
        movements: data.recentMovements.length,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : strings.common.unknownError;
      devWarn('[inicio] loadDashboard:error', message);
      setError(__DEV__ ? strings.home.loadError(message) : strings.home.loadFailedDescription);
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

  const goToLaunch = useCallback(
    (type: 'receita' | 'gasto') => {
      router.push({ pathname: '/(tabs)/lancar', params: { type } });
    },
    [router]
  );

  const goToPlanning = useCallback(
    (section: 'budget' | 'card' | 'recurring', segment?: 'income' | 'fixed' | 'expense') => {
      router.push({ pathname: '/(tabs)/planejamento', params: { section, segment } });
    },
    [router]
  );

  const goToCardPurchase = useCallback((purchaseId?: string) => {
    if (purchaseId) {
      router.push({ pathname: '/compra', params: { id: purchaseId } });
      return;
    }

    router.push('/compra');
  }, [router]);

  const formatMovementMeta = useCallback(
    (item: NonNullable<HomeSnapshot>['recentMovements'][number]) => {
      return [formatIsoDate(item.date), item.installment ? `${item.installment.current}/${item.installment.total}` : null]
        .filter(Boolean)
        .join(' • ');
    },
    [formatIsoDate]
  );

  const confirmRemoveMovement = useCallback(
    (item: NonNullable<HomeSnapshot>['recentMovements'][number]) => {
      if (item.kind !== 'expense' || !item.entityId) return;

      const title =
        item.source === 'card' ? strings.home.removePurchaseTitle : strings.home.removeExpenseTitle;
      const message =
        item.source === 'card'
          ? strings.home.removePurchaseDescription
          : item.installment
            ? strings.home.removeInstallmentDescription(item.installment.current, item.installment.total)
            : strings.home.removeExpenseDescription;

      Alert.alert(title, message, [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.remove,
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.source === 'card') {
                await excluirCompra(item.entityId);
              } else if (item.installment?.groupId) {
                await removeTransactionsByInstallmentGroupFromCurrent(
                  item.installment.groupId,
                  item.installment.current
                );
              } else {
                await removeTransactionById(item.entityId);
              }

              await loadDashboard();
            } catch {
              setError(strings.home.removeError);
            }
          },
        },
      ]);
    },
    [
      loadDashboard,
      strings.common.cancel,
      strings.common.remove,
      strings.home,
    ]
  );

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
          <Pressable
            style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
            onPress={() => router.push('/(tabs)/insights')}>
            <SummaryCard
              label={strings.home.monthBalanceLabel(snapshot.monthLabel)}
              value={formatCurrency(snapshot.monthBalance)}
              tone={monthTone}
              iconName="dollarsign.circle.fill"
            />
          </Pressable>

          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [styles.metricPressable, pressed && styles.cardPressed]}
              onPress={() => goToLaunch('receita')}>
              <MetricCard
                label={strings.home.income}
                value={formatCurrency(snapshot.monthIncome)}
                iconName="plus.circle.fill"
                tone="income"
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.metricPressable, pressed && styles.cardPressed]}
              onPress={() => goToLaunch('gasto')}>
              <MetricCard
                label={strings.home.expense}
                value={formatCurrency(snapshot.monthExpense)}
                iconName="minus.circle.fill"
                tone="expense"
              />
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [styles.metricPressable, pressed && styles.cardPressed]}
              onPress={() => goToPlanning('recurring', 'fixed')}>
              <MetricCard
                label={strings.home.fixedMonth}
                value={formatCurrency(snapshot.monthFixedExpense)}
                iconName="pin.fill"
                tone="warning"
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.metricPressable, pressed && styles.cardPressed]}
              onPress={() => goToCardPurchase()}>
              <MetricCard
                label={strings.home.currentInvoice}
                value={formatCurrency(snapshot.currentCardInvoice)}
                iconName="creditcard.fill"
                tone="info"
              />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.sectionCard, pressed && styles.cardPressed]}
            onPress={() => goToPlanning('card')}>
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
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
            onPress={() => goToPlanning('budget')}>
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
          </Pressable>

          <View style={styles.sectionCard}>
            <SectionHeader
              title={strings.home.recentTitle}
              subtitle={strings.home.recentSubtitle}
              iconName="info.circle.fill"
              actionLabel={strings.tabs.launch}
              onActionPress={() => goToLaunch('gasto')}
            />

            {snapshot.recentMovements.length === 0 ? (
              <EmptyState
                title={strings.home.emptyMovementsTitle}
                description={strings.home.emptyMovementsDescription}
              />
            ) : (
              <View style={styles.list}>
                {snapshot.recentMovements.map((item) => (
                  <View key={item.id} style={styles.listItemRow}>
                    {item.source === 'card' ? (
                      <Pressable
                        style={({ pressed }) => [styles.listItemMain, pressed && styles.listItemPressed]}
                        onPress={() => goToCardPurchase(item.entityId)}>
                        <TransactionListItem
                          title={item.title}
                          meta={formatMovementMeta(item)}
                          amount={resolveSignedAmount(item.kind, item.amount)}
                          kind={item.kind}
                        />
                      </Pressable>
                    ) : (
                      <View style={styles.listItemMain}>
                        <TransactionListItem
                          title={item.title}
                          meta={formatMovementMeta(item)}
                          amount={resolveSignedAmount(item.kind, item.amount)}
                          kind={item.kind}
                        />
                      </View>
                    )}

                    {item.kind === 'expense' && item.entityId && (item.source === 'manual' || item.source === 'card') ? (
                      <Pressable
                        style={({ pressed }) => [styles.inlineDeleteButton, pressed && styles.listItemPressed]}
                        onPress={() => confirmRemoveMovement(item)}>
                        <IconSymbol name="trash.fill" size={16} color={colors.expense} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      ) : null}

      {error && snapshot ? (
        <View style={styles.inlineFeedback}>
          <Text style={[styles.inlineErrorText, { color: colors.expense }]}>{error}</Text>
          <Pressable onPress={loadDashboard} style={styles.retryInline}>
            <Text style={[styles.retryText, { color: colors.info }]}>{strings.home.refreshData}</Text>
          </Pressable>
        </View>
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
    metricPressable: {
      flex: 1,
    },
    cardPressable: {
      borderRadius: Radius.lg,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardPressed: {
      opacity: 0.88,
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
    listItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    listItemMain: {
      flex: 1,
    },
    listItemPressed: {
      opacity: 0.88,
    },
    inlineDeleteButton: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: `${colors.expense}33`,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
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
    inlineFeedback: {
      gap: Spacing.xs,
      alignItems: 'center',
    },
    inlineErrorText: {
      fontSize: 12,
      textAlign: 'center',
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
