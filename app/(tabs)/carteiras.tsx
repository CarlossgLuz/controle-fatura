import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, AppScreen, EmptyState } from '@/components/app';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Dimensions, Radius, Spacing, Typography } from '@/constants/theme';
import { getCardConfig } from '@/data/local/finance-repository';
import { getHomeDashboardSnapshot } from '@/data/local/home-dashboard';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useI18n } from '@/hooks/use-i18n';
import { useLaunchSheet } from '@/providers/launch-sheet-context';

type WalletData = {
  card: Awaited<ReturnType<typeof getCardConfig>>;
  dashboard: Awaited<ReturnType<typeof getHomeDashboardSnapshot>>;
};

export default function CarteirasScreen() {
  const { colors } = useAppTheme();
  const { strings, formatCurrency, formatIsoDate } = useI18n();
  const { revision } = useLaunchSheet();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const [card, dashboard] = await Promise.all([
        getCardConfig(),
        getHomeDashboardSnapshot(new Date()),
      ]);
      setData({ card, dashboard });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWallet();
    }, [loadWallet])
  );

  useEffect(() => {
    if (revision > 0) {
      void loadWallet();
    }
  }, [loadWallet, revision]);

  return (
    <AppScreen>
      <AppHeader title={strings.wallets.title} subtitle={strings.wallets.subtitle} />

      {loading && !data ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="progressbar"
          style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{strings.wallets.loading}</Text>
        </View>
      ) : null}

      {error && !data ? (
        <EmptyState
          title={strings.wallets.loadFailedTitle}
          description={strings.wallets.loadFailedDescription}
          actionLabel={strings.common.tryAgain}
          onActionPress={loadWallet}
        />
      ) : null}

      {loading && data ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="progressbar"
          style={[
            styles.refreshStatus,
            { backgroundColor: colors.infoContainer, borderColor: colors.info },
          ]}>
          <Text style={[styles.refreshStatusText, { color: colors.onInfoContainer }]}>
            {strings.wallets.refreshing}
          </Text>
        </View>
      ) : null}

      {error && data ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.refreshWarning,
            { backgroundColor: colors.warningContainer, borderColor: colors.warning },
          ]}>
          <View style={styles.refreshWarningCopy}>
            <Text style={[styles.refreshWarningTitle, { color: colors.onWarningContainer }]}>
              {strings.wallets.refreshFailedTitle}
            </Text>
            <Text style={[styles.refreshWarningDescription, { color: colors.onWarningContainer }]}>
              {strings.wallets.refreshFailedDescription}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={loadWallet}
            style={({ pressed }) => [
              styles.refreshAction,
              {
                backgroundColor: pressed ? colors.actionPrimaryPressed : colors.actionPrimary,
              },
            ]}>
            <Text style={[styles.refreshActionText, { color: colors.onPrimaryAction }]}>
              {strings.wallets.retryRefresh}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {data ? (
        <>
          <View
            style={[
              styles.scopeCard,
              { backgroundColor: colors.infoContainer, borderColor: colors.info },
            ]}>
            <IconSymbol name="info.circle.fill" size={22} color={colors.onInfoContainer} />
            <View style={styles.scopeCopy}>
              <Text style={[styles.scopeTitle, { color: colors.onInfoContainer }]}>
                {strings.wallets.currentScopeTitle}
              </Text>
              <Text style={[styles.scopeDescription, { color: colors.onInfoContainer }]}>
                {strings.wallets.currentScopeDescription}
              </Text>
            </View>
          </View>

          <View style={[styles.walletCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.cardIcon, { backgroundColor: colors.surfaceElevated }]}>
                <IconSymbol name="creditcard.fill" size={24} color={colors.info} />
              </View>
              <View style={styles.cardHeading}>
                <Text style={[styles.cardEyebrow, { color: colors.textSecondary }]}>
                  {strings.wallets.mainCard}
                </Text>
                <Text style={[styles.cardName, { color: colors.textPrimary }]}>{data.card.name}</Text>
              </View>
            </View>

            <View style={[styles.invoiceBlock, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.invoiceLabel, { color: colors.textSecondary }]}>
                {strings.wallets.currentInvoice}
              </Text>
              <Text style={[styles.invoiceValue, { color: colors.expense }]}>
                {formatCurrency(data.dashboard.currentCardInvoice)}
              </Text>
            </View>

            <View style={styles.cycleBlock}>
              <Text style={[styles.cycleTitle, { color: colors.textPrimary }]}>
                {strings.wallets.invoiceCycle}
              </Text>
              <View style={styles.cycleRow}>
                <View style={styles.cycleItem}>
                  <Text style={[styles.cycleLabel, { color: colors.textSecondary }]}>
                    {strings.wallets.closing}
                  </Text>
                  <Text style={[styles.cycleValue, { color: colors.textPrimary }]}>
                    {formatIsoDate(data.dashboard.cardCycleClosing)}
                  </Text>
                </View>
                <View style={styles.cycleItem}>
                  <Text style={[styles.cycleLabel, { color: colors.textSecondary }]}>
                    {strings.wallets.due}
                  </Text>
                  <Text style={[styles.cycleValue, { color: colors.textPrimary }]}>
                    {formatIsoDate(data.dashboard.cardCycleDue)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  statusText: {
    ...Typography.body,
  },
  refreshStatus: {
    minHeight: Dimensions.minTouchTarget,
    borderWidth: 1,
    borderRadius: Radius.control,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  refreshStatusText: {
    ...Typography.body,
  },
  refreshWarning: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  refreshWarningCopy: {
    gap: Spacing.xs,
  },
  refreshWarningTitle: {
    ...Typography.bodyStrong,
  },
  refreshWarningDescription: {
    ...Typography.body,
  },
  refreshAction: {
    minHeight: Dimensions.buttonHeight,
    alignSelf: 'flex-start',
    borderRadius: Radius.control,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  refreshActionText: {
    ...Typography.label,
  },
  scopeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.lg,
  },
  scopeCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  scopeTitle: {
    ...Typography.bodyStrong,
  },
  scopeDescription: {
    ...Typography.body,
  },
  walletCard: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    flex: 1,
    gap: 2,
  },
  cardEyebrow: {
    ...Typography.caption,
  },
  cardName: {
    ...Typography.title2,
  },
  invoiceBlock: {
    borderRadius: Radius.control,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  invoiceLabel: {
    ...Typography.label,
  },
  invoiceValue: {
    ...Typography.display,
    fontVariant: ['tabular-nums'],
  },
  cycleBlock: {
    gap: Spacing.md,
  },
  cycleTitle: {
    ...Typography.bodyStrong,
  },
  cycleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  cycleItem: {
    flexGrow: 1,
    flexBasis: 140,
    gap: Spacing.xs,
  },
  cycleLabel: {
    ...Typography.caption,
  },
  cycleValue: {
    ...Typography.bodyStrong,
    fontVariant: ['tabular-nums'],
  },
});
