import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AppHeader,
  AppScreen,
  CategoryQuickAdd,
  DatePickerField,
  EmptyState,
  SectionHeader,
} from '@/components/app';
import { Radius, Spacing } from '@/constants/theme';
import {
  addRecurringEntry,
  addTransaction,
  createCustomCategory,
  listCategories,
  removeCustomCategory,
} from '@/data/local/finance-repository';
import { listCategoriesByUsage, type Category } from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';
import { useAppTheme } from '@/hooks/use-app-theme';

type LaunchType = 'receita' | 'gasto' | 'fixo';

interface LaunchForm {
  type: LaunchType;
  amount: string;
  description: string;
  date: `${number}-${number}-${number}`;
  dayOfMonth: string;
  categoryId: string;
}

function toIsoToday(date = new Date()): `${number}-${number}-${number}` {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as `${number}-${number}-${number}`;
}

function toMonthKey(date = new Date()): `${number}-${number}` {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}` as `${number}-${number}`;
}

function parseAmount(raw: string): number {
  const normalized = raw.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function usageFromType(type: LaunchType): 'income' | 'expense' | 'fixed' {
  if (type === 'receita') return 'income';
  if (type === 'fixo') return 'fixed';
  return 'expense';
}

export default function LancarScreen() {
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, mode === 'dark');

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<LaunchForm>({
    type: 'gasto',
    amount: '',
    description: '',
    date: toIsoToday(),
    dayOfMonth: String(new Date().getDate()),
    categoryId: 'expense-other',
  });
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await listCategories();
      setCategories(data);
    } catch {
      setError('Não foi possível carregar categorias.');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const categoryOptions = useMemo(() => {
    return listCategoriesByUsage(categories, usageFromType(form.type));
  }, [categories, form.type]);

  const customCategoryOptions = useMemo(
    () => categoryOptions.filter((entry) => !entry.system).map((entry) => ({ id: entry.id, name: entry.name })),
    [categoryOptions]
  );

  useEffect(() => {
    if (!categoryOptions.find((entry) => entry.id === form.categoryId)) {
      const fallback = categoryOptions[0]?.id ?? (form.type === 'receita' ? 'income-salary' : 'expense-other');
      setForm((prev) => ({ ...prev, categoryId: fallback }));
    }
  }, [categoryOptions, form.categoryId, form.type]);

  const onField = <K extends keyof LaunchForm>(key: K, value: LaunchForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): string | null => {
    if (!form.description.trim()) return 'Descrição é obrigatória.';

    const amount = parseAmount(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return 'Informe um valor válido.';

    if (!categoryOptions.find((entry) => entry.id === form.categoryId)) {
      return 'Selecione uma categoria válida.';
    }

    if (form.type === 'fixo') {
      const day = Number(form.dayOfMonth);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        return 'Dia do mês inválido para lançamento fixo.';
      }
    }

    return null;
  };

  const onSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const amount = parseAmount(form.amount);
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (form.type === 'fixo') {
        await addRecurringEntry({
          cardId: DEFAULT_CARD_CONFIG.id,
          kind: 'expense',
          amount,
          dayOfMonth: Number(form.dayOfMonth),
          categoryId: form.categoryId,
          description: form.description.trim(),
          startMonth: toMonthKey(),
          notes: undefined,
          endMonth: undefined,
        });
      } else {
        await addTransaction({
          cardId: DEFAULT_CARD_CONFIG.id,
          kind: form.type === 'receita' ? 'income' : 'expense',
          amount,
          date: form.date,
          categoryId: form.categoryId,
          description: form.description.trim(),
          notes: undefined,
          recurringEntryId: undefined,
        });
      }

      setSuccess(form.type === 'fixo' ? 'Fixo salvo no Planejamento.' : 'Lançamento salvo.');
      setForm((prev) => ({
        ...prev,
        amount: '',
        description: '',
        date: toIsoToday(),
        dayOfMonth: String(new Date().getDate()),
      }));
    } catch {
      setError('Não foi possível salvar agora.');
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
          disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar lançamento'}</Text>
        </Pressable>
      }>
      <AppHeader
        eyebrow="Fluxo guiado"
        title="Lançar"
        subtitle="Escolha o tipo e preencha só o necessário."
      />

      <View style={styles.typeRow}>
        {(['receita', 'gasto', 'fixo'] as LaunchType[]).map((item) => {
          const active = form.type === item;
          const toneStyle =
            item === 'receita'
              ? styles.typeChipIncomeActive
              : item === 'gasto'
                ? styles.typeChipExpenseActive
                : styles.typeChipFixedActive;
          const toneTextStyle =
            item === 'receita'
              ? styles.typeChipIncomeTextActive
              : item === 'gasto'
                ? styles.typeChipExpenseTextActive
                : styles.typeChipFixedTextActive;
          return (
            <Pressable
              key={item}
              style={[styles.typeChip, active && toneStyle]}
              onPress={() => onField('type', item)}>
              <Text style={[styles.typeChipText, active && toneTextStyle]}>
                {item === 'receita' ? 'Receita' : item === 'gasto' ? 'Gasto' : 'Fixo'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title={form.type === 'fixo' ? 'Novo fixo' : 'Novo lançamento'}
          subtitle={form.type === 'fixo' ? 'Será repetido mensalmente.' : 'Entra no mês atual.'}
        />

        <Text style={styles.label}>Valor</Text>
        <TextInput
          value={form.amount}
          onChangeText={(value) => onField('amount', value)}
          placeholder="0,00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          value={form.description}
          onChangeText={(value) => onField('description', value)}
          placeholder="Ex: Mercado, salário, aluguel"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {form.type === 'fixo' ? (
          <>
            <Text style={styles.label}>Dia do mês</Text>
            <TextInput
              value={form.dayOfMonth}
              onChangeText={(value) => onField('dayOfMonth', value)}
              placeholder="Ex: 10"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </>
        ) : (
          <DatePickerField label="Data" value={form.date} onChange={(value) => onField('date', value)} />
        )}

        <Text style={styles.label}>Categoria</Text>

        {loadingCategories ? (
          <Text style={styles.helperText}>Carregando categorias...</Text>
        ) : categoryOptions.length === 0 ? (
          <EmptyState
            title="Sem categorias"
            description="Crie uma categoria para esse tipo e continue o lançamento."
          />
        ) : (
          <View style={styles.chips}>
            <CategoryQuickAdd
              triggerMode="chip"
              kind={form.type === 'receita' ? 'income' : 'expense'}
              usage={form.type === 'receita' ? 'all' : form.type === 'fixo' ? 'fixed' : 'variable'}
              onSave={async (name, kind, usage) => {
                const created = await createCustomCategory({ name, kind, usage });
                await loadCategories();
                onField('categoryId', created.id);
              }}
              customCategories={customCategoryOptions}
              onRemove={async (categoryId) => {
                await removeCustomCategory(categoryId);
                await loadCategories();
                if (form.categoryId === categoryId) {
                  onField('categoryId', '');
                }
              }}
            />
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
        )}
      </View>

      {error ? <Text style={[styles.feedback, { color: colors.expense }]}>{error}</Text> : null}
      {success ? <Text style={[styles.feedback, { color: colors.income }]}>{success}</Text> : null}
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    typeRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    typeChip: {
      flex: 1,
      minHeight: 46,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeChipIncomeActive: {
      borderColor: `${colors.income}66`,
      backgroundColor: `${colors.income}14`,
    },
    typeChipExpenseActive: {
      borderColor: `${colors.expense}66`,
      backgroundColor: `${colors.expense}12`,
    },
    typeChipFixedActive: {
      borderColor: `${colors.warning}66`,
      backgroundColor: `${colors.warning}14`,
    },
    typeChipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    typeChipIncomeTextActive: {
      color: colors.income,
    },
    typeChipExpenseTextActive: {
      color: colors.expense,
    },
    typeChipFixedTextActive: {
      color: colors.warning,
    },
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
