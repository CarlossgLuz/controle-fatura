import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader, AppScreen, DatePickerField, EmptyState, SectionHeader } from '@/components/app';
import { Radius, Spacing } from '@/constants/theme';
import {
  getTransactionById,
  listCategories,
  updateTransaction,
} from '@/data/local/finance-repository';
import { listCategoriesByUsage, type Category } from '@/domain/finance';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatCurrencyInput, normalizeCurrencyInput, parseCurrencyInput } from '@/utils/currency-input';

interface EditExpenseForm {
  amount: string;
  description: string;
  date: `${number}-${number}-${number}`;
  categoryId: string;
}

export default function EditarGastoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const transactionId = typeof params.id === 'string' ? params.id : null;
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, mode === 'dark');

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<EditExpenseForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installmentMeta, setInstallmentMeta] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!transactionId) {
        setError('Lançamento inválido para edição.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [allCategories, transaction] = await Promise.all([
          listCategories(),
          getTransactionById(transactionId),
        ]);

        if (cancelled) return;

        if (!transaction || transaction.kind !== 'expense' || transaction.source !== 'manual') {
          setError('Este gasto não pode ser editado aqui.');
          setLoading(false);
          return;
        }

        setCategories(allCategories);
        setInstallmentMeta(
          transaction.installment
            ? { current: transaction.installment.current, total: transaction.installment.total }
            : null
        );
        setForm({
          amount: formatCurrencyInput(transaction.amount),
          description: transaction.description,
          date: transaction.date,
          categoryId: transaction.categoryId,
        });
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar o gasto.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  const categoryOptions = useMemo(
    () => listCategoriesByUsage(categories, 'expense'),
    [categories]
  );

  useEffect(() => {
    if (!form) return;
    if (categoryOptions.find((entry) => entry.id === form.categoryId)) return;

    const fallback = categoryOptions[0]?.id ?? 'expense-other';
    setForm((prev) => (prev ? { ...prev, categoryId: fallback } : prev));
  }, [categoryOptions, form]);

  const onField = <K extends keyof EditExpenseForm>(key: K, value: EditExpenseForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setError(null);
  };

  const onSave = async () => {
    if (!transactionId || !form) return;

    if (!form.description.trim()) {
      setError('Descrição é obrigatória.');
      return;
    }

    const amount = parseCurrencyInput(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    if (!categoryOptions.find((entry) => entry.id === form.categoryId)) {
      setError('Selecione uma categoria válida.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateTransaction(transactionId, {
        kind: 'expense',
        amount,
        date: form.date,
        categoryId: form.categoryId,
        description: form.description.trim(),
      });

      if (!updated) {
        setError('Lançamento não encontrado.');
        return;
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/inicio');
      }
    } catch {
      setError('Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAware
      footer={
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={saving || !form}>
          <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text>
        </Pressable>
      }>
      <AppHeader
        eyebrow="Últimos gastos"
        title="Editar gasto"
        subtitle="Ajuste o lançamento sem misturar com a tela de novo gasto."
      />

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.helperText}>Carregando gasto...</Text>
        </View>
      ) : null}

      {!loading && !form ? (
        <EmptyState
          title="Gasto indisponível"
          description={error ?? 'Não foi possível abrir este lançamento para edição.'}
        />
      ) : null}

      {form ? (
        <View style={styles.card}>
          <SectionHeader
            title="Dados do gasto"
            subtitle="Revise valor, data, categoria e descrição."
          />

          {installmentMeta ? (
            <Text style={styles.helperText}>
              Editando a parcela {installmentMeta.current} de {installmentMeta.total}. A alteração vale apenas para esta parcela.
            </Text>
          ) : null}

          <Text style={styles.label}>Valor</Text>
          <TextInput
            value={form.amount}
            onChangeText={(value) => onField('amount', normalizeCurrencyInput(value))}
            placeholder="0,00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            value={form.description}
            onChangeText={(value) => onField('description', value)}
            placeholder="Descrição do gasto"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <DatePickerField label="Data" value={form.date} onChange={(value) => onField('date', value)} />

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.chips}>
            {categoryOptions.map((category) => {
              const active = form.categoryId === category.id;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => onField('categoryId', category.id)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {error && form ? <Text style={[styles.feedback, { color: colors.expense }]}>{error}</Text> : null}
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: Spacing.xs,
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 12,
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
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    chip: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    chipTextActive: {
      color: isDark ? '#09111D' : '#FFFFFF',
    },
    feedback: {
      fontSize: 13,
    },
    saveButton: {
      minHeight: 50,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.75,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
