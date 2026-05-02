import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { getHomeDashboardSnapshot } from '@/data/local/home-dashboard';
import {
  removeTransactionById,
  removeTransactionsByInstallmentGroupFromCurrent,
} from '@/data/local/finance-repository';
import { excluirCompra } from '@/data/sqlite';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLaunchSheet } from '@/providers/launch-sheet-context';
import { devWarn } from '@/utils/logger';

type HomeSnapshot = Awaited<ReturnType<typeof getHomeDashboardSnapshot>>;
type Movement = NonNullable<HomeSnapshot>['recentMovements'][number];

function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function monthName() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long' });
}

export default function InicioScreen() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const { openSheet, revision } = useLaunchSheet();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';
  const styles = createStyles(colors, isDark);

  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openLaunch = useCallback(
    (type: 'receita' | 'gasto') => {
      openSheet(type);
    },
    [openSheet]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHomeDashboardSnapshot(new Date());
      setSnapshot(data);
    } catch (e) {
      devWarn('[inicio] load error', e);
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (revision > 0) {
      void load();
    }
  }, [load, revision]);

  const confirmRemove = useCallback(
    (item: Movement) => {
      if (item.kind !== 'expense' || !item.entityId) return;
      const isInstallment = Boolean(item.installment);
      Alert.alert(
        'Remover lancamento',
        isInstallment
          ? `Remover parcela ${item.installment!.current}/${item.installment!.total} e as seguintes?`
          : 'Remover este lancamento?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
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
                await load();
              } catch {
                setError('Erro ao remover. Tente novamente.');
              }
            },
          },
        ]
      );
    },
    [load]
  );

  const balance = snapshot?.monthBalance ?? 0;
  const isPositive = balance >= 0;
  const balanceColor = isPositive ? colors.income : colors.expense;
  const month = monthName();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>
              {month.charAt(0).toUpperCase() + month.slice(1)}
            </Text>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>Clarium</Text>
          </View>
          <Pressable
            style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/planejamento')}>
            <IconSymbol name="gearshape.fill" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Saldo do mes</Text>
          {loading && !snapshot ? (
            <View style={[styles.skeletonBalance, { backgroundColor: colors.surfaceElevated }]} />
          ) : (
            <Text style={[styles.balanceValue, { color: balanceColor }]}>
              {formatBRL(Math.abs(balance))}
            </Text>
          )}
          {snapshot ? (
            <Text style={[styles.balanceSign, { color: balanceColor }]}>
              {isPositive ? 'positivo' : 'negativo'}
            </Text>
          ) : null}

          <View style={[styles.balanceRow, { borderTopColor: colors.border }]}>
            <Pressable style={styles.balanceMetric} onPress={() => openLaunch('receita')}>
              <View style={[styles.metricDot, { backgroundColor: `${colors.income}20` }]}>
                <View style={[styles.dotInner, { backgroundColor: colors.income }]} />
              </View>
              <View>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Receitas</Text>
                <Text style={[styles.metricValue, { color: colors.income }]}>
                  {loading && !snapshot ? '-' : formatBRL(snapshot?.monthIncome ?? 0)}
                </Text>
              </View>
            </Pressable>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.balanceMetric} onPress={() => openLaunch('gasto')}>
              <View style={[styles.metricDot, { backgroundColor: `${colors.expense}20` }]}>
                <View style={[styles.dotInner, { backgroundColor: colors.expense }]} />
              </View>
              <View>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Gastos</Text>
                <Text style={[styles.metricValue, { color: colors.expense }]}>
                  {loading && !snapshot ? '-' : formatBRL(snapshot?.monthExpense ?? 0)}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {snapshot ? (
          <View style={styles.statsRow}>
            <Pressable
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/(tabs)/planejamento', params: { section: 'recurring', segment: 'fixed' } })}>
              <IconSymbol name="pin.fill" size={16} color={colors.warning} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Fixos/mes</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatBRL(snapshot.monthFixedExpense)}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/compra')}>
              <IconSymbol name="creditcard.fill" size={16} color={colors.info} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Fatura atual</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatBRL(snapshot.currentCardInvoice)}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {snapshot && snapshot.budgetTarget > 0 ? (
          <Pressable
            style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/(tabs)/planejamento', params: { section: 'budget' } })}>
            <View style={styles.budgetHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Meta do mes</Text>
                <Text style={[styles.budgetSub, { color: colors.textMuted }]}>
                  {formatBRL(snapshot.monthExpense)} de {formatBRL(snapshot.budgetTarget)}
                </Text>
              </View>
              <Text style={[styles.budgetPercent, { color: snapshot.budgetProgress >= 1 ? colors.expense : colors.textPrimary }]}>
                {Math.round(snapshot.budgetProgress * 100)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(snapshot.budgetProgress * 100, 100)}%`,
                    backgroundColor: snapshot.budgetProgress >= 1 ? colors.expense : snapshot.budgetProgress >= 0.8 ? colors.warning : colors.income,
                  },
                ]}
              />
            </View>
          </Pressable>
        ) : null}

        {snapshot ? (
          <Pressable
            style={[styles.cycleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/(tabs)/planejamento', params: { section: 'card' } })}>
            <View style={styles.cycleHeader}>
              <IconSymbol name="creditcard.fill" size={15} color={colors.info} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ciclo do cartao</Text>
            </View>
            <View style={styles.cycleRow}>
              <View style={[styles.cyclePill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.cycleLabel, { color: colors.textMuted }]}>Fechamento</Text>
                <Text style={[styles.cycleValue, { color: colors.textPrimary }]}>
                  {formatIsoDate(snapshot.cardCycleClosing)}
                </Text>
              </View>
              <View style={[styles.cyclePill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.cycleLabel, { color: colors.textMuted }]}>Vencimento</Text>
                <Text style={[styles.cycleValue, { color: colors.textPrimary }]}>
                  {formatIsoDate(snapshot.cardCycleDue)}
                </Text>
              </View>
            </View>
          </Pressable>
        ) : null}

        <View style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ultimos lancamentos</Text>
            <Pressable onPress={() => router.push('/(tabs)/extrato')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver extrato</Text>
            </Pressable>
          </View>

          {loading && !snapshot ? (
            <View style={styles.loadingPlaceholder}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.skeletonRow, { backgroundColor: colors.surfaceElevated }]} />
              ))}
            </View>
          ) : snapshot?.recentMovements.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="tray.fill" size={28} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Nenhum lancamento ainda
              </Text>
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => openLaunch('gasto')}>
                <Text style={styles.emptyBtnText}>Adicionar primeiro lancamento</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {snapshot?.recentMovements.map((item) => {
                const isIncome = item.kind === 'income';
                const amtColor = isIncome ? colors.income : colors.expense;
                const sign = isIncome ? '+' : '-';
                const meta = [
                  formatIsoDate(item.date),
                  item.installment
                    ? `${item.installment.current}/${item.installment.total}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' - ');

                return (
                  <View key={item.id} style={[styles.txRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.txIcon, { backgroundColor: `${amtColor}15` }]}>
                      <IconSymbol
                        name={isIncome ? 'arrow.down.left' : item.source === 'card' ? 'creditcard.fill' : 'arrow.up.right'}
                        size={14}
                        color={amtColor}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.txMeta, { color: colors.textMuted }]}>{meta}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: amtColor }]}>
                      {sign} {formatBRL(item.amount)}
                    </Text>
                    {item.kind === 'expense' && item.entityId ? (
                      <Pressable
                        style={[styles.txDelete, { borderColor: `${colors.expense}30` }]}
                        onPress={() => confirmRemove(item)}>
                        <IconSymbol name="trash.fill" size={13} color={colors.expense} />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.expense}12`, borderColor: `${colors.expense}30` }]}>
            <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
            <Pressable onPress={load}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: isDark ? '#0B1220' : '#F3F6FB' },
    scroll: { paddingHorizontal: 20, gap: 14, paddingTop: 8 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    greeting: { fontSize: 13, fontWeight: '500' },
    appName: { fontSize: 26, fontWeight: '800' },
    headerBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    balanceCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 4 },
    balanceLabel: { fontSize: 13, fontWeight: '500' },
    balanceValue: { fontSize: 38, fontWeight: '800' },
    balanceSign: { fontSize: 12, fontWeight: '600' },
    skeletonBalance: { height: 46, width: '60%', borderRadius: 8 },
    balanceRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
    balanceMetric: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    metricDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    dotInner: { width: 10, height: 10, borderRadius: 5 },
    metricLabel: { fontSize: 12, fontWeight: '500' },
    metricValue: { fontSize: 15, fontWeight: '700', marginTop: 1 },
    metricDivider: { width: 1, marginHorizontal: 12 },
    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
    statLabel: { fontSize: 12, fontWeight: '500', marginTop: 4 },
    statValue: { fontSize: 16, fontWeight: '700' },
    budgetCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
    budgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    budgetSub: { fontSize: 13, marginTop: 2 },
    budgetPercent: { fontSize: 22, fontWeight: '800' },
    progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },
    cycleCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
    cycleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cycleRow: { flexDirection: 'row', gap: 10 },
    cyclePill: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 2 },
    cycleLabel: { fontSize: 11, fontWeight: '600' },
    cycleValue: { fontSize: 14, fontWeight: '700' },
    recentCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
    recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    seeAll: { fontSize: 13, fontWeight: '600' },
    loadingPlaceholder: { gap: 10 },
    skeletonRow: { height: 48, borderRadius: 10 },
    emptyState: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    emptyText: { fontSize: 14 },
    emptyBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
    emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    transactionList: { gap: 0 },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    txInfo: { flex: 1 },
    txTitle: { fontSize: 14, fontWeight: '600' },
    txMeta: { fontSize: 12, marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: '700' },
    txDelete: {
      width: 32,
      height: 32,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6, alignItems: 'center' },
    errorText: { fontSize: 13 },
    retryText: { fontSize: 13, fontWeight: '600' },
  });
}
