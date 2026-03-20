import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
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
  addInstallmentTransaction,
  addTransaction,
  createCustomCategory,
  listCategories,
  removeCustomCategory,
} from '@/data/local/finance-repository';
import { listCategoriesByUsage, type Category } from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useI18n } from '@/hooks/use-i18n';
import { normalizeCurrencyInput, parseCurrencyInput, sanitizeDigits } from '@/utils/currency-input';

type LaunchType = 'receita' | 'gasto';

interface LaunchForm {
  type: LaunchType;
  amount: string;
  description: string;
  date: `${number}-${number}-${number}`;
  categoryId: string;
  installmentCurrent: string;
  installmentTotal: string;
}

function toIsoToday(date = new Date()): `${number}-${number}-${number}` {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as `${number}-${number}-${number}`;
}

function usageFromType(type: LaunchType): 'income' | 'expense' {
  if (type === 'receita') return 'income';
  return 'expense';
}

function defaultLaunchForm(type: LaunchType = 'gasto'): LaunchForm {
  return {
    type,
    amount: '',
    description: '',
    date: toIsoToday(),
    categoryId: type === 'receita' ? 'income-salary' : 'expense-other',
    installmentCurrent: '1',
    installmentTotal: '1',
  };
}

function normalizeTypeParam(value: unknown): LaunchType | null {
  return value === 'receita' || value === 'gasto' ? value : null;
}

export default function LancarScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { colors, mode } = useAppTheme();
  const { strings } = useI18n();
  const styles = createStyles(colors, mode === 'dark');

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<LaunchForm>(() => defaultLaunchForm(normalizeTypeParam(params.type) ?? 'gasto'));
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
      setError(strings.launch.categoryLoadError);
    } finally {
      setLoadingCategories(false);
    }
  }, [strings.launch.categoryLoadError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const nextType = normalizeTypeParam(params.type);
    if (!nextType) return;

    setForm((prev) => ({
      ...(prev.type === nextType ? prev : defaultLaunchForm(nextType)),
      type: nextType,
    }));
  }, [params.type]);

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
    if (!form.description.trim()) return strings.launch.validationDescription;

    const amount = parseCurrencyInput(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return strings.launch.validationAmount;

    if (!categoryOptions.find((entry) => entry.id === form.categoryId)) {
      return strings.launch.validationCategory;
    }

    if (form.type === 'gasto') {
      const installments = Number(form.installmentTotal || '1');
      if (!Number.isInteger(installments) || installments < 1 || installments > 36) {
        return strings.launch.validationInstallments;
      }

      const currentInstallment = Number(form.installmentCurrent || '1');
      if (
        !Number.isInteger(currentInstallment) ||
        currentInstallment < 1 ||
        currentInstallment > installments
      ) {
        return strings.launch.validationInstallmentCurrent;
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

    const amount = parseCurrencyInput(form.amount);
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        cardId: DEFAULT_CARD_CONFIG.id,
        kind: form.type === 'receita' ? 'income' : 'expense',
        amount,
        date: form.date,
        categoryId: form.categoryId,
        description: form.description.trim(),
        notes: undefined,
        recurringEntryId: undefined,
      } as const;

      const installments = form.type === 'gasto' ? Number(form.installmentTotal || '1') : 1;
      const currentInstallment = form.type === 'gasto' ? Number(form.installmentCurrent || '1') : 1;

      if (form.type === 'gasto' && installments > 1) {
        await addInstallmentTransaction(payload, installments, currentInstallment);
      } else {
        await addTransaction(payload);
      }

      const savedInstallments = form.type === 'gasto' ? installments - currentInstallment + 1 : 1;
      setSuccess(
        installments > 1
          ? strings.launch.saveSuccessInstallments(savedInstallments)
          : strings.launch.saveSuccessEntry
      );
      setForm((prev) => ({
        ...prev,
        amount: '',
        description: '',
        date: toIsoToday(),
        installmentCurrent: '1',
        installmentTotal: '1',
      }));
    } catch {
      setError(strings.launch.saveError);
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
          <Text style={styles.saveButtonText}>{saving ? strings.launch.saving : strings.launch.save}</Text>
        </Pressable>
      }>
      <AppHeader
        eyebrow={strings.launch.eyebrow}
        title={strings.launch.title}
        subtitle={strings.launch.subtitle}
      />

      <View style={styles.typeRow}>
        {(['receita', 'gasto'] as LaunchType[]).map((item) => {
          const active = form.type === item;
          const toneStyle =
            item === 'receita'
              ? styles.typeChipIncomeActive
              : styles.typeChipExpenseActive;
          const toneTextStyle =
            item === 'receita'
              ? styles.typeChipIncomeTextActive
              : styles.typeChipExpenseTextActive;
          return (
            <Pressable
              key={item}
              style={[styles.typeChip, active && toneStyle]}
              onPress={() => onField('type', item)}>
              <Text style={[styles.typeChipText, active && toneTextStyle]}>
                {item === 'receita' ? strings.launch.income : strings.launch.expense}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title={strings.launch.newEntryTitle}
          subtitle={strings.launch.newEntrySubtitle}
        />

        <Text style={styles.label}>{strings.launch.amount}</Text>
        <TextInput
          value={form.amount}
          onChangeText={(value) => onField('amount', normalizeCurrencyInput(value))}
          placeholder={strings.launch.valuePlaceholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Text style={styles.label}>{strings.launch.description}</Text>
        <TextInput
          value={form.description}
          onChangeText={(value) => onField('description', value)}
          placeholder={strings.launch.descriptionPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <DatePickerField label={strings.launch.date} value={form.date} onChange={(value) => onField('date', value)} />

        {form.type === 'gasto' ? (
          <>
            <View style={styles.installmentRow}>
              <View style={styles.installmentField}>
                <Text style={styles.label}>{strings.launch.installments}</Text>
                <TextInput
                  value={form.installmentTotal}
                  onChangeText={(value) => onField('installmentTotal', sanitizeDigits(value))}
                  placeholder={strings.launch.installmentsPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.installmentField}>
                <Text style={styles.label}>{strings.launch.installmentCurrent}</Text>
                <TextInput
                  value={form.installmentCurrent}
                  onChangeText={(value) => onField('installmentCurrent', sanitizeDigits(value))}
                  placeholder={strings.launch.installmentCurrentPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>
            <Text style={styles.helperText}>{strings.launch.installmentsHint}</Text>
          </>
        ) : null}

        <Text style={styles.label}>{strings.launch.category}</Text>

        {loadingCategories ? (
          <Text style={styles.helperText}>{strings.launch.loadingCategories}</Text>
        ) : categoryOptions.length === 0 ? (
          <EmptyState
            title={strings.launch.noCategoriesTitle}
            description={strings.launch.noCategoriesDescription}
          />
        ) : (
          <View style={styles.chips}>
            <CategoryQuickAdd
              triggerMode="chip"
              kind={form.type === 'receita' ? 'income' : 'expense'}
              usage={form.type === 'receita' ? 'all' : 'variable'}
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
    installmentRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    installmentField: {
      flex: 1,
      gap: Spacing.xs,
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
