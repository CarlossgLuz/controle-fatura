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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { criarEInserirCompra, editarCompra, obterCompraPorId } from '@/data/sqlite';
import { DatePickerField } from '@/components/app';
import {
  CATEGORIAS_COMPRA,
  buildDefaultCompraFormValues,
  validateCompraForm,
  type CategoriaCompra,
  type CompraFormErrors,
  type CompraFormValues,
} from '@/domain';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

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

function ErrorText({
  message,
  color,
}: {
  message?: string;
  color: string;
}) {
  if (!message) return null;
  return <Text style={[styles.errorText, { color }]}>{message}</Text>;
}

export default function CompraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const compraId = typeof params.id === 'string' ? params.id : undefined;
  const isEdit = Boolean(compraId);

  const insets = useSafeAreaInsets();
  const { mode, colors } = useAppTheme();

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
  const subtitle = isEdit
    ? 'Atualize os campos e mantenha o ciclo de fatura consistente.'
    : 'Preencha os dados da compra para registrar no ciclo correto.';

  const themedStyles = useMemo(
    () => createThemedStyles(colors, insets.top, insets.bottom, mode === 'dark'),
    [colors, insets.bottom, insets.top, mode]
  );

  const onField = <K extends keyof CompraFormValues>(key: K, value: CompraFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (
      key === 'valor' ||
      key === 'dataCompra' ||
      key === 'titulo' ||
      key === 'local' ||
      key === 'categoria'
    ) {
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
    <View style={themedStyles.screen}>
      <KeyboardAvoidingView
        style={themedStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 8}>
        <ScrollView
          contentContainerStyle={themedStyles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          <View style={themedStyles.header}>
            <Pressable onPress={() => router.back()} style={themedStyles.backButton}>
              <Text style={themedStyles.backText}>Voltar</Text>
            </Pressable>
            <Text style={themedStyles.title}>{title}</Text>
            <Text style={themedStyles.subtitle}>{subtitle}</Text>
          </View>

          {loading ? (
            <View style={themedStyles.card}>
              <Text style={themedStyles.loadingText}>Carregando compra...</Text>
            </View>
          ) : (
            <View style={themedStyles.card}>
              <Text style={themedStyles.label}>Valor *</Text>
              <TextInput
                value={form.valor}
                onChangeText={(value) => onField('valor', value)}
                placeholder="0,00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="next"
                style={themedStyles.input}
              />
              <ErrorText message={errors.valor} color={colors.danger} />

              <DatePickerField
                label="Data da compra *"
                value={form.dataCompra}
                onChange={(value) => onField('dataCompra', value)}
              />
              <ErrorText message={errors.dataCompra} color={colors.danger} />

              <Text style={themedStyles.label}>Título *</Text>
              <TextInput
                value={form.titulo}
                onChangeText={(value) => onField('titulo', value)}
                placeholder="Ex: Mercado do mês"
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                style={themedStyles.input}
              />
              <ErrorText message={errors.titulo} color={colors.danger} />

              <Text style={themedStyles.label}>Descrição (opcional)</Text>
              <TextInput
                value={form.descricao}
                onChangeText={(value) => onField('descricao', value)}
                placeholder="Detalhes da compra"
                placeholderTextColor={colors.textMuted}
                style={[themedStyles.input, themedStyles.inputMultiline]}
                multiline
              />

              <Text style={themedStyles.label}>Local *</Text>
              <TextInput
                value={form.local}
                onChangeText={(value) => onField('local', value)}
                placeholder="Ex: Supermercado Central"
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                style={themedStyles.input}
              />
              <ErrorText message={errors.local} color={colors.danger} />

              <Text style={themedStyles.label}>Categoria *</Text>
              <View style={themedStyles.chips}>
                {CATEGORIAS_COMPRA.map((categoria) => {
                  const active = form.categoria === categoria;
                  return (
                    <Pressable
                      key={categoria}
                      style={[themedStyles.chip, active && themedStyles.chipActive]}
                      onPress={() => onField('categoria', categoria)}>
                      <Text style={[themedStyles.chipText, active && themedStyles.chipTextActive]}>
                        {labelCategoria(categoria)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <ErrorText message={errors.categoria} color={colors.danger} />

              <Text style={themedStyles.label}>Parcela (opcional)</Text>
              <View style={themedStyles.installmentRow}>
                <TextInput
                  value={form.parcelaAtual}
                  onChangeText={(value) => onField('parcelaAtual', value)}
                  placeholder="Atual"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={[themedStyles.input, themedStyles.installmentInput]}
                />
                <TextInput
                  value={form.parcelaTotal}
                  onChangeText={(value) => onField('parcelaTotal', value)}
                  placeholder="Total"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={[themedStyles.input, themedStyles.installmentInput]}
                />
              </View>
              <ErrorText message={errors.parcela} color={colors.danger} />

              {formError ? <Text style={themedStyles.formError}>{formError}</Text> : null}

              <Pressable
                style={[themedStyles.saveButton, saving && themedStyles.saveButtonDisabled]}
                onPress={onSave}
                disabled={saving}>
                <Text style={themedStyles.saveButtonText}>
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

function createThemedStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  topInset: number,
  bottomInset: number,
  isDarkMode: boolean
) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: topInset + Spacing.sm,
      paddingBottom: bottomInset + Spacing.xxl,
      gap: Spacing.lg,
    },
    header: {
      gap: Spacing.xs,
    },
    backButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    backText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: Spacing.xs,
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      color: colors.textPrimary,
      fontSize: 15,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
    },
    inputMultiline: {
      minHeight: 88,
      textAlignVertical: 'top',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    chip: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.pill,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    chipTextActive: {
      color: isDarkMode ? '#03111B' : '#FFFFFF',
    },
    installmentRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    installmentInput: {
      flex: 1,
    },
    errorText: {
      fontSize: 12,
      marginTop: -1,
    },
    formError: {
      color: colors.danger,
      fontSize: 13,
      marginTop: Spacing.sm,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.md,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: isDarkMode ? '#03111B' : '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 12,
    marginTop: -1,
  },
});
