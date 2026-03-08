import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  CATEGORIAS_COMPRA,
  buildDefaultCompraFormValues,
  validateCompraForm,
  type CategoriaCompra,
  type CompraFormErrors,
  type CompraFormValues,
} from '@/domain';
import { criarEInserirCompra, editarCompra, obterCompraPorId } from '@/data/sqlite';

function gerarIdCompra(): string {
  return `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function labelCategoria(categoria: CategoriaCompra): string {
  const labels: Record<CategoriaCompra, string> = {
    alimentacao: 'Alimentação',
    transporte: 'Transporte',
    moradia: 'Moradia',
    saude: 'Saúde',
    educacao: 'Educação',
    lazer: 'Lazer',
    assinaturas: 'Assinaturas',
    outros: 'Outros',
  };

  return labels[categoria];
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

export default function CompraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const compraId = typeof params.id === 'string' ? params.id : undefined;
  const isEdit = Boolean(compraId);

  const [form, setForm] = useState<CompraFormValues>(() => buildDefaultCompraFormValues());
  const [errors, setErrors] = useState<CompraFormErrors>({});
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !compraId) return;

    let cancelled = false;
    setLoading(true);
    setFormError(null);

    obterCompraPorId(compraId)
      .then((compra) => {
        if (cancelled) return;
        if (!compra) {
          setFormError('Compra não encontrada para edição.');
          return;
        }

        setForm({
          valor: String(compra.valor).replace('.', ','),
          dataCompra: compra.dataCompra,
          titulo: compra.titulo,
          descricao: compra.descricao ?? '',
          local: compra.local,
          categoria: compra.categoria,
          parcelaAtual: compra.parcela ? String(compra.parcela.atual) : '',
          parcelaTotal: compra.parcela ? String(compra.parcela.total) : '',
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFormError('Não foi possível carregar a compra.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [compraId, isEdit]);

  const title = useMemo(() => (isEdit ? 'Editar compra' : 'Nova compra'), [isEdit]);

  const onField = <K extends keyof CompraFormValues>(key: K, value: CompraFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'valor' || key === 'dataCompra' || key === 'titulo' || key === 'local' || key === 'categoria') {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (key === 'parcelaAtual' || key === 'parcelaTotal') {
      setErrors((prev) => ({ ...prev, parcela: undefined }));
    }
    setFormError(null);
  };

  const onSave = async () => {
    setFormError(null);
    const result = validateCompraForm(form);
    if (!result.isValid || !result.value) {
      setErrors(result.errors);
      return;
    }

    setSaving(true);
    try {
      if (isEdit && compraId) {
        const updated = await editarCompra(compraId, result.value);
        if (!updated) {
          setFormError('Compra não encontrada para edição.');
          return;
        }
      } else {
        await criarEInserirCompra(result.value, gerarIdCompra());
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      setFormError('Não foi possível salvar a compra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Cadastre compras com ciclo de fatura automático.</Text>
          </View>

          {loading ? (
            <View style={styles.card}>
              <Text style={styles.loadingText}>Carregando compra...</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>Valor *</Text>
              <TextInput
                value={form.valor}
                onChangeText={(value) => onField('valor', value)}
                placeholder="0,00"
                placeholderTextColor="#5E6B84"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <ErrorText message={errors.valor} />

              <Text style={styles.label}>Data da compra (YYYY-MM-DD) *</Text>
              <TextInput
                value={form.dataCompra}
                onChangeText={(value) => onField('dataCompra', value)}
                placeholder="2026-03-08"
                placeholderTextColor="#5E6B84"
                style={styles.input}
              />
              <ErrorText message={errors.dataCompra} />

              <Text style={styles.label}>Título *</Text>
              <TextInput
                value={form.titulo}
                onChangeText={(value) => onField('titulo', value)}
                placeholder="Ex: Mercado do mês"
                placeholderTextColor="#5E6B84"
                style={styles.input}
              />
              <ErrorText message={errors.titulo} />

              <Text style={styles.label}>Descrição (opcional)</Text>
              <TextInput
                value={form.descricao}
                onChangeText={(value) => onField('descricao', value)}
                placeholder="Detalhes da compra"
                placeholderTextColor="#5E6B84"
                style={[styles.input, styles.inputMultiline]}
                multiline
              />

              <Text style={styles.label}>Local *</Text>
              <TextInput
                value={form.local}
                onChangeText={(value) => onField('local', value)}
                placeholder="Ex: Supermercado Central"
                placeholderTextColor="#5E6B84"
                style={styles.input}
              />
              <ErrorText message={errors.local} />

              <Text style={styles.label}>Categoria *</Text>
              <View style={styles.chips}>
                {CATEGORIAS_COMPRA.map((categoria) => {
                  const active = form.categoria === categoria;
                  return (
                    <Pressable
                      key={categoria}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => onField('categoria', categoria)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {labelCategoria(categoria)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <ErrorText message={errors.categoria} />

              <Text style={styles.label}>Parcela (opcional)</Text>
              <View style={styles.installmentRow}>
                <TextInput
                  value={form.parcelaAtual}
                  onChangeText={(value) => onField('parcelaAtual', value)}
                  placeholder="Atual"
                  placeholderTextColor="#5E6B84"
                  keyboardType="number-pad"
                  style={[styles.input, styles.installmentInput]}
                />
                <TextInput
                  value={form.parcelaTotal}
                  onChangeText={(value) => onField('parcelaTotal', value)}
                  placeholder="Total"
                  placeholderTextColor="#5E6B84"
                  keyboardType="number-pad"
                  style={[styles.input, styles.installmentInput]}
                />
              </View>
              <ErrorText message={errors.parcela} />

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={onSave}
                disabled={saving}>
                <Text style={styles.saveButtonText}>
                  {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Salvar compra'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070A13',
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  header: {
    gap: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 4,
  },
  backText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#93A0B7',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#0B1222',
    borderColor: '#1E2A41',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  loadingText: {
    color: '#A8B4CA',
    fontSize: 14,
  },
  label: {
    color: '#DDE5F1',
    fontSize: 13,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#111C33',
    borderColor: '#22324C',
    borderWidth: 1,
    borderRadius: 12,
    color: '#F8FAFC',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inputMultiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#E5E7EB',
    borderColor: '#E5E7EB',
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#111827',
  },
  installmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  installmentInput: {
    flex: 1,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: -1,
  },
  formError: {
    color: '#FCA5A5',
    fontSize: 13,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});
