import { useMemo, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { addRecurringEntry, addTransaction } from '@/data/local/finance-repository';
import { DEFAULT_CATEGORIES } from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';
import { useAppTheme } from '@/hooks/use-app-theme';

type LaunchType = 'receita' | 'gasto' | 'fixo';

interface LaunchForm {
  type: LaunchType;
  amount: string;
  description: string;
  date: string;
  dayOfMonth: string;
  categoryId: string;
}

function toIsoToday(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export default function LancarScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, insets.bottom, insets.top, mode === 'dark');

  const [form, setForm] = useState<LaunchForm>({
    type: 'gasto',
    amount: '',
    description: '',
    date: toIsoToday(),
    dayOfMonth: String(new Date().getDate()),
    categoryId: 'expense-other',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    const kind = form.type === 'receita' ? 'income' : 'expense';
    return DEFAULT_CATEGORIES.filter((entry) => entry.kind === kind && entry.active);
  }, [form.type]);

  const onField = <K extends keyof LaunchForm>(key: K, value: LaunchForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): string | null => {
    if (form.description.trim().length === 0) {
      return 'Descrição é obrigatória.';
    }

    const amount = parseAmount(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Informe um valor válido.';
    }

    if (form.type === 'fixo') {
      const day = Number(form.dayOfMonth);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        return 'Dia do mês inválido para lançamento fixo.';
      }
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      return 'Data inválida. Use YYYY-MM-DD.';
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
          date: form.date as `${number}-${number}-${number}`,
          categoryId: form.categoryId,
          description: form.description.trim(),
          notes: undefined,
          recurringEntryId: undefined,
        });
      }

      setSuccess(form.type === 'fixo' ? 'Fixo salvo.' : 'Movimentação salva.');
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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 8}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Lançar</Text>
          <Text style={styles.subtitle}>Receita, gasto ou fixo com poucos campos.</Text>

          <View style={styles.typeRow}>
            {(['receita', 'gasto', 'fixo'] as LaunchType[]).map((item) => {
              const active = form.type === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => {
                    const nextCategory = item === 'receita' ? 'income-salary' : 'expense-other';
                    onField('type', item);
                    onField('categoryId', nextCategory);
                  }}>
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                    {item === 'receita' ? 'Receita' : item === 'gasto' ? 'Gasto' : 'Fixo'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
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
              <>
                <Text style={styles.label}>Data (YYYY-MM-DD)</Text>
                <TextInput
                  value={form.date}
                  onChangeText={(value) => onField('date', value)}
                  placeholder="2026-03-08"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </>
            )}

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.chips}>
              {categoryOptions.map((category) => {
                const active = form.categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => onField('categoryId', category.id)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={onSave}
            disabled={saving}>
            <Text style={styles.primaryButtonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  bottomInset: number,
  topInset: number,
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
      paddingTop: Math.max(topInset * 0.15, Spacing.md),
      paddingBottom: bottomInset + 104,
      gap: Spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    typeRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    typeChip: {
      flex: 1,
      minHeight: 44,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated,
    },
    typeChipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    typeChipTextActive: {
      color: colors.textPrimary,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      gap: Spacing.sm,
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
      color: isDarkMode ? '#03111B' : '#FFFFFF',
    },
    footer: {
      position: 'absolute',
      left: Spacing.xl,
      right: Spacing.xl,
      bottom: Math.max(bottomInset, Spacing.md),
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    successText: {
      color: colors.success,
      fontSize: 13,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    primaryButtonDisabled: {
      opacity: 0.75,
    },
    primaryButtonText: {
      color: isDarkMode ? '#03111B' : '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
