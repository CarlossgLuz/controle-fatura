import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, AppScreen, EmptyState, MetricCard, ProgressCard, SectionHeader } from '@/components/app';
import { Radius, Spacing } from '@/constants/theme';
import { getInsightsSnapshot } from '@/data/local/insights-dashboard';
import { useI18n } from '@/hooks/use-i18n';
import { useAppTheme } from '@/hooks/use-app-theme';
import { devInfo, devWarn } from '@/utils/logger';

type InsightsSnapshot = Awaited<ReturnType<typeof getInsightsSnapshot>>;

export default function InsightsScreen() {
  const { colors } = useAppTheme();
  const { strings, formatCurrency, formatPercent, formatMonthLabel } = useI18n();
  const styles = createStyles(colors);

  const [snapshot, setSnapshot] = useState<InsightsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryMonthKey, setSelectedHistoryMonthKey] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    devInfo('[insights] loadInsights:start');
    setLoading(true);
    setError(null);

    try {
      const data = await getInsightsSnapshot(new Date());
      setSnapshot(data);
      devInfo('[insights] loadInsights:ok', {
        monthKey: data.monthKey,
        categories: data.expensesByCategory.length,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : strings.common.unknownError;
      devWarn('[insights] loadInsights:error', message);
      setError(__DEV__ ? strings.insights.loadError(message) : strings.insights.loadFailedDescription);
    } finally {
      setLoading(false);
    }
  }, [strings.common.unknownError, strings.insights]);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );

  useEffect(() => {
    if (!snapshot?.monthHistory.length) return;
    if (selectedHistoryMonthKey && snapshot.monthHistory.some((entry) => entry.monthKey === selectedHistoryMonthKey)) {
      return;
    }

    setSelectedHistoryMonthKey(snapshot.monthKey);
  }, [selectedHistoryMonthKey, snapshot]);

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
        <View
          style={[
            styles.barFill,
            {
              width: share > 0 ? `${Math.max(share * 100, 4)}%` : '0%',
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );

  const historyScaleMax = useMemo(() => {
    if (!snapshot?.monthHistory.length) return 0;
    return snapshot.monthHistory.reduce(
      (max, entry) => Math.max(max, entry.income, entry.expense, Math.abs(entry.balance)),
      0
    );
  }, [snapshot]);

  const selectedHistoryMonth = useMemo(() => {
    if (!snapshot?.monthHistory.length) return null;
    return (
      snapshot.monthHistory.find((entry) => entry.monthKey === selectedHistoryMonthKey) ??
      snapshot.monthHistory[snapshot.monthHistory.length - 1]
    );
  }, [selectedHistoryMonthKey, snapshot]);

  const yearSummary = useMemo(() => {
    if (!snapshot?.monthHistory.length) {
      return {
        income: 0,
        expense: 0,
        balance: 0,
      };
    }

    return snapshot.monthHistory.reduce(
      (acc, entry) => ({
        income: acc.income + entry.income,
        expense: acc.expense + entry.expense,
        balance: acc.balance + entry.balance,
      }),
      { income: 0, expense: 0, balance: 0 }
    );
  }, [snapshot]);

  const historyMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    return formatMonthLabel(new Date(year, month - 1, 1));
  };

  const widthFromValue = (value: number) => {
    if (historyScaleMax <= 0 || value <= 0) return '0%' as const;
    return `${Math.max(8, Math.round((Math.abs(value) / historyScaleMax) * 100))}%` as const;
  };

  return (
    <AppScreen>
      <AppHeader eyebrow={strings.insights.eyebrow} title={strings.insights.title} subtitle={strings.insights.subtitle} />

      {loading && !snapshot ? (
        <View style={styles.loadingCard}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{strings.insights.loading}</Text>
        </View>
      ) : null}

      {!loading && error && !snapshot ? (
        <EmptyState
          title={strings.insights.loadFailedTitle}
          description={strings.insights.loadFailedDescription}
          actionLabel={strings.common.tryAgain}
          onActionPress={loadInsights}
        />
      ) : null}

      {snapshot && !snapshot.hasAnyData ? (
        <EmptyState title={strings.insights.noDataTitle} description={strings.insights.noDataDescription} />
      ) : null}

      {snapshot && snapshot.hasAnyData ? (
        <>
          <View style={styles.card}>
            <SectionHeader
              title={strings.insights.sectionQuickPulseTitle}
              subtitle={strings.insights.sectionQuickPulseSubtitle}
            />
            <View style={styles.row}>
              <MetricCard
                label={strings.insights.monthBalanceTitle}
                value={formatCurrency(snapshot.quickPulse.balance)}
                tone={snapshot.quickPulse.balance >= 0 ? 'income' : 'expense'}
                iconName="dollarsign.circle.fill"
              />
              <MetricCard
                label={strings.insights.cardShareTitle}
                value={formatPercent(snapshot.quickPulse.cardShare)}
                tone="info"
                iconName="creditcard.fill"
              />
            </View>
            <MetricCard
              label={strings.insights.fixedIncomeShareTitle}
              value={
                snapshot.quickPulse.fixedIncomeShare === null
                  ? strings.insights.noIncomeBaseShort
                  : formatPercent(snapshot.quickPulse.fixedIncomeShare)
              }
              caption={
                snapshot.quickPulse.fixedIncomeShare === null ? strings.insights.noIncomeBase : undefined
              }
              tone="warning"
              iconName="pin.fill"
            />
          </View>

          <View style={styles.card}>
            <SectionHeader
              title={strings.insights.sectionIncomeVsExpenseTitle}
              subtitle={strings.insights.sectionIncomeVsExpenseSubtitle}
            />
            <BarItem
              label={strings.insights.incomeLabel}
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
              label={strings.insights.expenseLabel}
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
            <SectionHeader title={strings.insights.sectionCategoryTitle} subtitle={strings.insights.sectionCategorySubtitle} />
            {snapshot.expensesByCategory.length === 0 ? (
              <Text style={[styles.placeholder, { color: colors.textSecondary }]}>{strings.insights.noExpenses}</Text>
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
            <SectionHeader
              title={strings.insights.sectionFixedVariableTitle}
              subtitle={strings.insights.sectionFixedVariableSubtitle}
            />
            <BarItem
              label={strings.insights.fixedLabel}
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
              label={strings.insights.variableLabel}
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

          <View style={styles.card}>
            <SectionHeader title={strings.insights.sectionPaceTitle} subtitle={strings.insights.sectionPaceSubtitle} />
            <View style={styles.row}>
              <MetricCard
                label={strings.insights.dailyAverageTitle}
                value={formatCurrency(snapshot.quickPulse.averageDailyExpense)}
                iconName="calendar.circle.fill"
                tone="default"
              />
              <MetricCard
                label={strings.insights.projectedExpenseTitle}
                value={formatCurrency(snapshot.quickPulse.projectedExpense)}
                iconName="chart.bar.fill"
                tone={
                  snapshot.budgetProgress.target > 0 &&
                  snapshot.quickPulse.projectedExpense > snapshot.budgetProgress.target
                    ? 'expense'
                    : 'default'
                }
              />
            </View>
          </View>

          <ProgressCard
            title={strings.insights.budgetTitle}
            subtitle={
              snapshot.budgetProgress.target > 0
                ? strings.insights.budgetProgress(
                    formatCurrency(snapshot.budgetProgress.spent),
                    formatCurrency(snapshot.budgetProgress.target)
                  )
                : strings.insights.budgetNoTarget
            }
            progress={snapshot.budgetProgress.progress}
          />

          <View style={styles.card}>
            <SectionHeader
              title={strings.insights.sectionTopCategoryTitle}
              subtitle={strings.insights.sectionTopCategorySubtitle}
            />
            {snapshot.topExpenseCategory ? (
              <BarItem
                label={snapshot.topExpenseCategory.label}
                value={snapshot.topExpenseCategory.amount}
                share={snapshot.topExpenseCategory.share}
                color={colors.expense}
              />
            ) : (
              <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
                {strings.insights.topCategoryEmpty}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader
              title={strings.insights.sectionHistoryTitle}
              subtitle={strings.insights.sectionHistorySubtitle}
            />
            <View style={[styles.historyHero, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.historyHeroHeader}>
                <Text style={[styles.historyHeroTitle, { color: colors.textPrimary }]}>
                  {selectedHistoryMonth ? historyMonthLabel(selectedHistoryMonth.monthKey) : ''}
                </Text>
                <Text
                  style={[
                    styles.historyHeroBalance,
                    {
                      color: !selectedHistoryMonth
                        ? colors.textPrimary
                        : selectedHistoryMonth.balance >= 0
                          ? colors.income
                          : colors.expense,
                    },
                  ]}>
                  {formatCurrency(selectedHistoryMonth?.balance ?? 0)}
                </Text>
              </View>
              <Text style={[styles.historyHeroSubtitle, { color: colors.textSecondary }]}>
                {strings.insights.historyBalanceLabel}
              </Text>

              <View style={styles.historyCompareGroup}>
                <View style={styles.historyCompareRow}>
                  <View style={styles.historyCompareLabelRow}>
                    <Text style={[styles.historyLabel, { color: colors.textMuted }]}>{strings.insights.historyIncomeLabel}</Text>
                    <Text style={[styles.historyValue, { color: colors.income }]}>
                      {formatCurrency(selectedHistoryMonth?.income ?? 0)}
                    </Text>
                  </View>
                  <View style={[styles.historyTrack, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View
                      style={[
                        styles.historyFill,
                        {
                          width: widthFromValue(selectedHistoryMonth?.income ?? 0),
                          backgroundColor: colors.income,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.historyCompareRow}>
                  <View style={styles.historyCompareLabelRow}>
                    <Text style={[styles.historyLabel, { color: colors.textMuted }]}>{strings.insights.historyExpenseLabel}</Text>
                    <Text style={[styles.historyValue, { color: colors.expense }]}>
                      {formatCurrency(selectedHistoryMonth?.expense ?? 0)}
                    </Text>
                  </View>
                  <View style={[styles.historyTrack, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View
                      style={[
                        styles.historyFill,
                        {
                          width: widthFromValue(selectedHistoryMonth?.expense ?? 0),
                          backgroundColor: colors.expense,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.historySummaryRow}>
                <View style={[styles.historySummaryChip, { backgroundColor: `${colors.income}14` }]}>
                  <Text style={[styles.historySummaryChipLabel, { color: colors.textMuted }]}>
                    {strings.insights.historyIncomeLabel}
                  </Text>
                  <Text style={[styles.historySummaryChipValue, { color: colors.income }]}>
                    {formatCurrency(yearSummary.income)}
                  </Text>
                </View>
                <View style={[styles.historySummaryChip, { backgroundColor: `${colors.expense}12` }]}>
                  <Text style={[styles.historySummaryChipLabel, { color: colors.textMuted }]}>
                    {strings.insights.historyExpenseLabel}
                  </Text>
                  <Text style={[styles.historySummaryChipValue, { color: colors.expense }]}>
                    {formatCurrency(yearSummary.expense)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.historySummaryChip,
                    {
                      backgroundColor: `${(yearSummary.balance >= 0 ? colors.income : colors.expense)}12`,
                    },
                  ]}>
                  <Text style={[styles.historySummaryChipLabel, { color: colors.textMuted }]}>
                    {strings.insights.historyBalanceLabel}
                  </Text>
                  <Text
                    style={[
                      styles.historySummaryChipValue,
                      { color: yearSummary.balance >= 0 ? colors.income : colors.expense },
                    ]}>
                    {formatCurrency(yearSummary.balance)}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyMonthStrip}>
              {snapshot.monthHistory.map((item) => {
                const active = selectedHistoryMonth?.monthKey === item.monthKey;
                return (
                  <Pressable
                    key={item.monthKey}
                    style={[
                      styles.historyMonthChip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? `${colors.primary}12` : colors.surfaceElevated,
                      },
                    ]}
                    onPress={() => setSelectedHistoryMonthKey(item.monthKey)}>
                    <Text
                      style={[
                        styles.historyMonthChipText,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}>
                      {historyMonthLabel(item.monthKey)}
                    </Text>
                    <Text
                      style={[
                        styles.historyMonthChipBalance,
                        { color: item.balance >= 0 ? colors.income : colors.expense },
                      ]}>
                      {formatCurrency(item.balance)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.historyList}>
              {snapshot.monthHistory.map((item) => {
                const active = selectedHistoryMonth?.monthKey === item.monthKey;
                return (
                  <Pressable
                    key={item.monthKey}
                    style={[
                      styles.historyRow,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? `${colors.primary}0D` : colors.surfaceElevated,
                      },
                    ]}
                    onPress={() => setSelectedHistoryMonthKey(item.monthKey)}>
                    <View style={styles.historyRowTop}>
                      <Text style={[styles.historyMonth, { color: colors.textPrimary }]}>
                        {historyMonthLabel(item.monthKey)}
                      </Text>
                      <Text
                        style={[
                          styles.historyBalanceCompact,
                          { color: item.balance >= 0 ? colors.income : colors.expense },
                        ]}>
                        {formatCurrency(item.balance)}
                      </Text>
                    </View>
                    <View style={styles.historyLineGroup}>
                      <View style={[styles.historyTrack, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View
                          style={[
                            styles.historyFill,
                            {
                              width: widthFromValue(item.income),
                              backgroundColor: colors.income,
                            },
                          ]}
                        />
                      </View>
                      <View style={[styles.historyTrack, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View
                          style={[
                            styles.historyFill,
                            {
                              width: widthFromValue(item.expense),
                              backgroundColor: colors.expense,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader title={strings.insights.sectionPaymentTitle} subtitle={strings.insights.sectionPaymentSubtitle} />
            {snapshot.paymentMethodUsage.length === 0 ? (
              <Text style={[styles.placeholder, { color: colors.textSecondary }]}>{strings.insights.noMovements}</Text>
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
        <Text style={[styles.inlineError, { color: colors.warning }]}>{strings.insights.staleData}</Text>
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
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    historyList: {
      gap: Spacing.sm,
    },
    historyHero: {
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    historyHeroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    historyHeroTitle: {
      fontSize: 17,
      fontWeight: '700',
      textTransform: 'capitalize',
      flex: 1,
    },
    historyHeroBalance: {
      fontSize: 22,
      fontWeight: '800',
    },
    historyHeroSubtitle: {
      fontSize: 12,
      marginTop: -Spacing.sm,
    },
    historyCompareGroup: {
      gap: Spacing.sm,
    },
    historyCompareRow: {
      gap: Spacing.xs,
    },
    historyCompareLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    historySummaryRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    historySummaryChip: {
      flex: 1,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      gap: 2,
    },
    historySummaryChipLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    historySummaryChipValue: {
      fontSize: 13,
      fontWeight: '700',
    },
    historyMonthStrip: {
      gap: Spacing.sm,
      paddingRight: Spacing.xs,
    },
    historyMonthChip: {
      minWidth: 112,
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      gap: 2,
    },
    historyMonthChipText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    historyMonthChipBalance: {
      fontSize: 12,
      fontWeight: '700',
    },
    historyRow: {
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      gap: Spacing.xs,
    },
    historyRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    historyMonth: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    historyBalanceCompact: {
      fontSize: 12,
      fontWeight: '700',
    },
    historyLineGroup: {
      gap: Spacing.xs,
    },
    historyTrack: {
      height: 8,
      borderWidth: 1,
      borderRadius: Radius.pill,
      overflow: 'hidden',
    },
    historyFill: {
      height: '100%',
      borderRadius: Radius.pill,
    },
    historyValues: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    historyValueBlock: {
      flex: 1,
      gap: 2,
    },
    historyLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    historyValue: {
      fontSize: 12,
      fontWeight: '700',
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
