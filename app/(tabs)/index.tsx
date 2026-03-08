import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Controle de fatura</Text>
        <Text style={styles.title}>Visão geral</Text>

        <View style={styles.invoiceCard}>
          <Text style={styles.cardLabel}>Fatura atual</Text>
          <Text style={styles.cardAmount}>R$ 1.248,70</Text>
          <View style={styles.invoiceRow}>
            <Text style={styles.cardMeta}>Vencimento: 20/03</Text>
            <Text style={styles.cardMeta}>Limite: R$ 5.000,00</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do ciclo</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total gasto</Text>
              <Text style={styles.summaryValue}>R$ 1.248,70</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Disponível</Text>
              <Text style={styles.summaryValue}>R$ 3.751,30</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Compras</Text>
              <Text style={styles.summaryValue}>0 este ciclo</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Fechamento</Text>
              <Text style={styles.summaryValue}>15/03</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos lançamentos</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sem lançamentos por enquanto</Text>
            <Text style={styles.emptyText}>
              Assim que você registrar compras, elas aparecem aqui com data e valor.
            </Text>
          </View>
        </View>

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
