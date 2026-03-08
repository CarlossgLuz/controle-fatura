import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { excluirCompra, listarComprasDoCicloAtual } from '@/data/sqlite';
import { calcularCicloAtual, CARTAO_PADRAO, resumirComprasDoCiclo, type Compra } from '@/domain';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

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

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, colors } = useAppTheme();

  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referenciaCiclo, setReferenciaCiclo] = useState(() => new Date());

  const loadCompras = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const referencia = new Date();
      const data = await listarComprasDoCicloAtual(referencia, CARTAO_PADRAO);
      setCompras(data);
      setReferenciaCiclo(referencia);
    } catch {
      setError('Não foi possível carregar os dados da fatura.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCompras();
    }, [loadCompras])
  );

  const resumo = useMemo(() => resumirComprasDoCiclo(compras), [compras]);
  const cicloAtual = useMemo(
    () => calcularCicloAtual(referenciaCiclo, CARTAO_PADRAO),
    [referenciaCiclo]
  );
  const ultimosLancamentos = useMemo(() => compras.slice(0, 6), [compras]);

  const onDelete = useCallback(
    async (id: string) => {
      try {
        await excluirCompra(id);
        await loadCompras();
      } catch {
        setError('Não foi possível excluir a compra.');
      }
    },
    [loadCompras]
  );

  const askDelete = useCallback(
    (compra: Compra) => {
      Alert.alert('Excluir lançamento', `Deseja excluir "${compra.titulo}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(compra.id) },
      ]);
    },
    [onDelete]
  );

  const styles = useMemo(
    () => createStyles(colors, insets.bottom, mode === 'dark'),
    [colors, insets.bottom, mode]
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.greeting}>Controle de fatura</Text>
          <Text style={styles.title}>Visão geral</Text>
        </View>

        <View style={styles.invoiceCard}>
          <Text style={styles.cardLabel}>Fatura atual</Text>
          <Text style={styles.cardAmount}>{formatCurrency(resumo.totalFaturaAtual)}</Text>
          <View style={styles.invoiceRow}>
            <Text style={styles.cardMeta}>Fechamento: {formatDate(cicloAtual.fechamento)}</Text>
            <Text style={styles.cardMeta}>Vencimento: {formatDate(cicloAtual.vencimento)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do ciclo</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total da fatura</Text>
              <Text style={styles.summaryValue}>{formatCurrency(resumo.totalFaturaAtual)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Compras no ciclo</Text>
              <Text style={styles.summaryValue}>{resumo.quantidadeCompras}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Parceladas</Text>
              <Text style={styles.summaryValue}>{resumo.quantidadeParceladas}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Período</Text>
              <Text style={styles.summaryValue}>
                {formatDate(cicloAtual.inicio)} - {formatDate(cicloAtual.fim)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos lançamentos</Text>
          {loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Carregando lançamentos...</Text>
            </View>
          ) : ultimosLancamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma compra no ciclo</Text>
              <Text style={styles.emptyText}>
                Registre um lançamento para começar a acompanhar esta fatura.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {ultimosLancamentos.map((compra) => (
                <View key={compra.id} style={styles.launchItem}>
                  <Pressable
                    style={styles.launchContent}
                    onPress={() => router.push({ pathname: '/compra', params: { id: compra.id } })}>
                    <View style={styles.launchTopRow}>
                      <Text style={styles.launchTitle}>{compra.titulo}</Text>
                      <Text style={styles.launchAmount}>{formatCurrency(compra.valor)}</Text>
                    </View>
                    <Text style={styles.launchMeta}>
                      {formatDate(compra.dataCompra)} • {compra.local}
                      {compra.parcela ? ` • ${compra.parcela.atual}/${compra.parcela.total}` : ''}
                    </Text>
                  </Pressable>
                  <View style={styles.launchActions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        router.push({ pathname: '/compra', params: { id: compra.id } })
                      }>
                      <Text style={styles.editButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={() => askDelete(compra)}>
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.ctaButton} onPress={() => router.push('/compra')}>
          <Text style={styles.ctaText}>Adicionar compra</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  bottomInset: number,
  isDarkMode: boolean
) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: bottomInset + 104,
      gap: Spacing.lg,
    },
    header: {
      gap: Spacing.xs,
    },
    greeting: {
      color: colors.textMuted,
      fontSize: 13,
      letterSpacing: 0.3,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '700',
    },
    invoiceCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    cardLabel: {
      color: colors.textMuted,
      fontSize: 13,
    },
    cardAmount: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    invoiceRow: {
      marginTop: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    cardMeta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    section: {
      gap: Spacing.sm,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    summaryItem: {
      width: '48%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 12,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    list: {
      gap: Spacing.sm,
    },
    launchItem: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    launchContent: {
      gap: Spacing.xs,
    },
    launchTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    launchTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    launchAmount: {
      color: colors.secondary,
      fontSize: 14,
      fontWeight: '700',
    },
    launchMeta: {
      color: colors.textMuted,
      fontSize: 12,
    },
    launchActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    editButton: {
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
    },
    editButtonText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    deleteButton: {
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: `${colors.danger}22`,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      gap: Spacing.xs,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    ctaButton: {
      marginTop: Spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      color: isDarkMode ? '#03111B' : '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
