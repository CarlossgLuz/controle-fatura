import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { excluirCompra, listarComprasDoCicloAtual } from '@/data/sqlite';
import { calcularCicloAtual, CARTAO_PADRAO, resumirComprasDoCiclo, type Compra } from '@/domain';

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
  const ultimosLancamentos = useMemo(() => compras.slice(0, 5), [compras]);

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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Controle de fatura</Text>
        <Text style={styles.title}>Visão geral</Text>

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
              <Text style={styles.summaryValue}>{formatDate(cicloAtual.inicio)} - {formatDate(cicloAtual.fim)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos lançamentos</Text>
          {loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Carregando...</Text>
            </View>
          ) : ultimosLancamentos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sem lançamentos por enquanto</Text>
              <Text style={styles.emptyText}>
                Assim que você registrar compras, elas aparecem aqui com data e valor.
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
                  <Pressable style={styles.deleteButton} onPress={() => onDelete(compra.id)}>
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                  </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070A13',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 18,
  },
  greeting: {
    color: '#7C8798',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  title: {
    color: '#F2F4F8',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 2,
  },
  invoiceCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 10,
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  cardAmount: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  invoiceRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  summaryValue: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: 10,
  },
  launchItem: {
    backgroundColor: '#0B1222',
    borderColor: '#1E2A41',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  launchContent: {
    gap: 5,
  },
  launchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  launchTitle: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  launchAmount: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  launchMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#2A1010',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteButtonText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#0B1222',
    borderColor: '#1E2A41',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  ctaButton: {
    marginTop: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#0B1120',
    fontSize: 15,
    fontWeight: '700',
  },
});
