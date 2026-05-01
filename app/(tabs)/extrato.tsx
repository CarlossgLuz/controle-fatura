import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import {
  removeTransactionById,
  removeTransactionsByInstallmentGroupFromCurrent,
} from '@/data/local/finance-repository';
import type { MonthlyMovement } from '@/data/local/finance-month-aggregation';
import {
  currentMonthKey,
  formatMonthKeyLabel,
  loadMonthExtract,
  shiftMonthKey,
  type MonthExtract,
} from '@/data/local/extrato-loader';
import { excluirCompra } from '@/data/sqlite';
import { useAppTheme } from '@/hooks/use-app-theme';

type FilterKind = 'all' | 'income' | 'expense';

function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function groupByDate(movements: MonthlyMovement[]): { date: string; items: MonthlyMovement[] }[] {
  const map = new Map<string, MonthlyMovement[]>();
  for (const m of movements) {
    const list = map.get(m.date) ?? [];
    list.push(m);
    map.set(m.date, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

export default function ExtratoScreen() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';
  const styles = createStyles(colors, isDark);

  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [extract, setExtract] = useState<MonthExtract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKind>('all');

  const openLaunch = useCallback(
    (type: 'receita' | 'gasto') => {
      router.push({ pathname: '/(tabs)/lancar', params: { type } });
    },
    [router]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadMonthExtract(monthKey);
      setExtract(data);
    } catch {
      setError('Erro ao carregar extrato.');
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const goToPrev = () => setMonthKey((k) => shiftMonthKey(k, -1));
  const goToNext = () => {
    const next = shiftMonthKey(monthKey, 1);
    if (next <= currentMonthKey()) setMonthKey(next);
  };
  const isCurrentMonth = monthKey === currentMonthKey();

  const confirmRemove = (item: MonthlyMovement) => {
    if (item.kind !== 'expense' || !item.entityId) return;
    Alert.alert(
      'Remover lancamento',
      item.installment
        ? `Remover parcela ${item.installment.current}/${item.installment.total} e as seguintes?`
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
              setError('Erro ao remover.');
            }
          },
        },
      ]
    );
  };

  const filtered = (extract?.movements ?? []).filter((m) => {
    if (filter === 'income') return m.kind === 'income';
    if (filter === 'expense') return m.kind === 'expense';
    return true;
  });

  const grouped = groupByDate(filtered);

  const filters: { key: FilterKind; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'income', label: 'Receitas' },
    { key: 'expense', label: 'Gastos' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Extrato</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => openLaunch('gasto')}>
          <IconSymbol name="plus" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={[styles.monthNav, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.monthArrow} onPress={goToPrev}>
          <IconSymbol name="chevron.left" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
          {formatMonthKeyLabel(monthKey)}
        </Text>
        <Pressable style={styles.monthArrow} onPress={goToNext} disabled={isCurrentMonth}>
          <IconSymbol
            name="chevron.right"
            size={18}
            color={isCurrentMonth ? colors.border : colors.textSecondary}
          />
        </Pressable>
      </View>

      {extract ? (
        <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Receitas</Text>
            <Text style={[styles.summaryVal, { color: colors.income }]}>
              {formatBRL(extract.summary.incomeTotal)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Gastos</Text>
            <Text style={[styles.summaryVal, { color: colors.expense }]}>
              {formatBRL(extract.summary.expenseTotal)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Saldo</Text>
            <Text style={[styles.summaryVal, { color: extract.summary.balance >= 0 ? colors.income : colors.expense }]}>
              {formatBRL(extract.summary.balance)}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceElevated,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}>
              <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
        {extract ? (
          <Text style={[styles.countLabel, { color: colors.textMuted }]}>
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.skeletonItem, { backgroundColor: colors.surfaceElevated }]} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
            <Pressable onPress={load}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : grouped.length === 0 ? (
          <View style={styles.centerState}>
            <IconSymbol name="tray.fill" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Nenhum lancamento</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {filter !== 'all'
                ? 'Tente mudar o filtro acima'
                : 'Adicione lancamentos com o botao +'}
            </Text>
            {filter === 'all' ? (
              <Pressable
                style={[styles.addFirstBtn, { backgroundColor: colors.primary }]}
                onPress={() => openLaunch('gasto')}>
                <Text style={styles.addFirstBtnText}>Novo lancamento</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          grouped.map(({ date, items }) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateSep}>
                <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
                  {formatDateShort(date)}
                </Text>
                <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
              </View>

              {items.map((item) => {
                const isIncome = item.kind === 'income';
                const amtColor = isIncome ? colors.income : colors.expense;
                const meta = item.installment
                  ? `${item.installment.current}/${item.installment.total}`
                  : item.source === 'card'
                    ? 'Cartao'
                    : item.source === 'recurring'
                      ? 'Recorrente'
                      : null;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.txItem,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <View style={[styles.txIconBox, { backgroundColor: `${amtColor}15` }]}>
                      <IconSymbol
                        name={
                          isIncome
                            ? 'arrow.down.left'
                            : item.source === 'card'
                              ? 'creditcard.fill'
                              : item.installment
                                ? 'rectangle.stack.fill'
                                : 'arrow.up.right'
                        }
                        size={15}
                        color={amtColor}
                      />
                    </View>
                    <View style={styles.txBody}>
                      <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {meta ? (
                        <Text style={[styles.txMeta, { color: colors.textMuted }]}>{meta}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.txAmt, { color: amtColor }]}>
                      {isIncome ? '+' : '-'} {formatBRL(item.amount)}
                    </Text>
                    {item.kind === 'expense' && item.entityId ? (
                      <Pressable
                        style={[styles.deleteBtn, { borderColor: `${colors.expense}30` }]}
                        onPress={() => confirmRemove(item)}>
                        <IconSymbol name="trash.fill" size={13} color={colors.expense} />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: isDark ? '#0B1220' : '#F3F6FB' },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    screenTitle: { fontSize: 22, fontWeight: '800' },
    addBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    monthArrow: { padding: 4 },
    monthLabel: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
    summaryBar: {
      flexDirection: 'row',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
    },
    summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
    summaryLbl: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    summaryVal: { fontSize: 14, fontWeight: '700' },
    summaryDivider: { width: 1, marginHorizontal: 8 },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterChipText: { fontSize: 13, fontWeight: '600' },
    countLabel: { marginLeft: 'auto', fontSize: 12 },
    list: { flex: 1 },
    loadingContainer: { gap: 8, padding: 20 },
    skeletonItem: { height: 60, borderRadius: 12 },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
    errorText: { fontSize: 14 },
    retryText: { fontSize: 14, fontWeight: '600' },
    emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
    emptyDesc: { fontSize: 14, textAlign: 'center' },
    addFirstBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
    addFirstBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    dateGroup: { gap: 6, paddingBottom: 8, paddingHorizontal: 16, marginTop: 4 },
    dateSep: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
    dateLabel: { fontSize: 12, fontWeight: '600' },
    dateLine: { flex: 1, height: 1 },
    txItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
    },
    txIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    txBody: { flex: 1 },
    txTitle: { fontSize: 14, fontWeight: '600' },
    txMeta: { fontSize: 12, marginTop: 2 },
    txAmt: { fontSize: 14, fontWeight: '700' },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
