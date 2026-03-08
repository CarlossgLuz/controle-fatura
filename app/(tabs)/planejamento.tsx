import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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

import {
  clearBudgetConfig,
  getBudgetConfig,
  getCardConfig,
  listRecurringEntries,
  removeRecurringEntryById,
  resetCardConfig,
  setRecurringEntryActive,
  updateCardConfig,
  updateRecurringEntry,
  upsertBudgetTarget,
  addRecurringEntry,
} from '@/data/local/finance-repository';
import { Radius, Spacing } from '@/constants/theme';
import { DEFAULT_CATEGORIES, type RecurringEntry } from '@/domain/finance';
import { useAppTheme } from '@/hooks/use-app-theme';

interface RecurringForm {
  description: string;
  amount: string;
  dayOfMonth: string;
  categoryId: string;
}

interface CardForm {
  name: string;
  closingDay: string;
  dueDay: string;
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

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function buildDefaultForm(kind: 'income' | 'expense'): RecurringForm {
  return {
    description: '',
    amount: '',
    dayOfMonth: String(new Date().getDate()),
    categoryId: kind === 'income' ? 'income-salary' : 'expense-other',
  };
}

function validateRecurringForm(form: RecurringForm): string | null {
  if (form.description.trim().length === 0) return 'Descrição é obrigatória.';
  const amount = parseAmount(form.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 'Valor inválido.';
  const day = Number(form.dayOfMonth);
  if (!Number.isInteger(day) || day < 1 || day > 31) return 'Dia do mês inválido.';
  return null;
}

export default function PlanejamentoScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, insets.bottom, mode === 'dark');

  const [incomeForm, setIncomeForm] = useState<RecurringForm>(() => buildDefaultForm('income'));
  const [expenseForm, setExpenseForm] = useState<RecurringForm>(() => buildDefaultForm('expense'));
  const [budgetInput, setBudgetInput] = useState('');
  const [cardForm, setCardForm] = useState<CardForm>({ name: '', closingDay: '5', dueDay: '8' });

  const [entries, setEntries] = useState<RecurringEntry[]>([]);
  const [budgetTarget, setBudgetTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<RecurringForm>(() => buildDefaultForm('expense'));

  const recurringIncome = useMemo(() => entries.filter((entry) => entry.kind === 'income'), [entries]);
  const recurringExpense = useMemo(() => entries.filter((entry) => entry.kind === 'expense'), [entries]);

  const loadData = useCallback(async () => {
    setError(null);

    try {
      const [recurring, budget, card] = await Promise.all([
        listRecurringEntries(),
        getBudgetConfig(),
        getCardConfig(),
      ]);

      setEntries(recurring);
      setBudgetTarget(budget?.targetAmount ?? null);
      setBudgetInput(budget?.targetAmount ? String(budget.targetAmount).replace('.', ',') : '');
      setCardForm({
        name: card.name,
        closingDay: String(card.closingDay),
        dueDay: String(card.dueDay),
      });
    } catch {
      setError('Não foi possível carregar o planejamento.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onCreateRecurring = async (kind: 'income' | 'expense') => {
    const form = kind === 'income' ? incomeForm : expenseForm;
    const validationError = validateRecurringForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await addRecurringEntry({
        cardId: 'card-main',
        kind,
        amount: parseAmount(form.amount),
        dayOfMonth: Number(form.dayOfMonth),
        categoryId: form.categoryId,
        description: form.description.trim(),
        startMonth: toMonthKey(),
        endMonth: undefined,
        notes: undefined,
      });

      setSuccess(kind === 'income' ? 'Receita recorrente criada.' : 'Gasto fixo criado.');
      if (kind === 'income') {
        setIncomeForm(buildDefaultForm('income'));
      } else {
        setExpenseForm(buildDefaultForm('expense'));
      }

      await loadData();
    } catch {
      setError('Não foi possível salvar recorrência.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: RecurringEntry) => {
    setEditingId(entry.id);
    setEditingForm({
      description: entry.description,
      amount: String(entry.amount).replace('.', ','),
      dayOfMonth: String(entry.dayOfMonth),
      categoryId: entry.categoryId,
    });
  };

  const onSaveEdit = async (entry: RecurringEntry) => {
    const validationError = validateRecurringForm(editingForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateRecurringEntry(entry.id, {
        description: editingForm.description.trim(),
        amount: parseAmount(editingForm.amount),
        dayOfMonth: Number(editingForm.dayOfMonth),
        categoryId: editingForm.categoryId,
      });
      setEditingId(null);
      setSuccess('Recorrência atualizada.');
      await loadData();
    } catch {
      setError('Não foi possível atualizar recorrência.');
    } finally {
      setSaving(false);
    }
  };

  const onDeleteRecurring = (entry: RecurringEntry) => {
    Alert.alert('Excluir recorrência', `Deseja excluir "${entry.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeRecurringEntryById(entry.id);
            setSuccess('Recorrência excluída.');
            await loadData();
          } catch {
            setError('Não foi possível excluir recorrência.');
          }
        },
      },
    ]);
  };

  const onToggleRecurring = async (entry: RecurringEntry) => {
    try {
      await setRecurringEntryActive(entry.id, !entry.active);
      setSuccess(entry.active ? 'Recorrência desativada.' : 'Recorrência ativada.');
      await loadData();
    } catch {
      setError('Não foi possível alterar status da recorrência.');
    }
  };

  const onSaveBudget = async () => {
    const amount = parseAmount(budgetInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe uma meta mensal válida.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await upsertBudgetTarget(toMonthKey(), amount);
      setBudgetTarget(updated.targetAmount);
      setSuccess('Meta mensal salva.');
    } catch {
      setError('Não foi possível salvar meta mensal.');
    } finally {
      setSaving(false);
    }
  };

  const onDeleteBudget = async () => {
    try {
      await clearBudgetConfig();
      setBudgetTarget(null);
      setBudgetInput('');
      setSuccess('Meta mensal removida.');
    } catch {
      setError('Não foi possível remover meta mensal.');
    }
  };

  const onSaveCard = async () => {
    const closingDay = Number(cardForm.closingDay);
    const dueDay = Number(cardForm.dueDay);

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateCardConfig({
        name: cardForm.name,
        closingDay,
        dueDay,
      });
      setCardForm({
        name: updated.name,
        closingDay: String(updated.closingDay),
        dueDay: String(updated.dueDay),
      });
      setSuccess('Configuração do cartão salva.');
    } catch {
      setError('Não foi possível salvar cartão. Verifique os campos.');
    } finally {
      setSaving(false);
    }
  };

  const onResetCard = async () => {
    try {
      await resetCardConfig();
      await loadData();
      setSuccess('Cartão restaurado para padrão.');
    } catch {
      setError('Não foi possível restaurar cartão.');
    }
  };

  const renderRecurringForm = (
    title: string,
    kind: 'income' | 'expense',
    form: RecurringForm,
    setForm: (value: RecurringForm) => void
  ) => {
    const categories = DEFAULT_CATEGORIES.filter((entry) => entry.kind === kind && entry.active);

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          value={form.description}
          onChangeText={(value) => setForm({ ...form, description: value })}
          placeholder="Ex: Salário / Aluguel"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Valor</Text>
            <TextInput
              value={form.amount}
              onChangeText={(value) => setForm({ ...form, amount: value })}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Dia</Text>
            <TextInput
              value={form.dayOfMonth}
              onChangeText={(value) => setForm({ ...form, dayOfMonth: value })}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chips}>
          {categories.map((category) => {
            const active = form.categoryId === category.id;
            return (
              <Pressable
                key={category.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setForm({ ...form, categoryId: category.id })}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.buttonPrimary, saving && styles.buttonDisabled]}
          onPress={() => onCreateRecurring(kind)}
          disabled={saving}>
          <Text style={styles.buttonPrimaryText}>Criar</Text>
        </Pressable>
      </View>
    );
  };

  const renderRecurringList = (title: string, items: RecurringEntry[]) => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum item cadastrado.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const editing = editingId === item.id;
            const categories = DEFAULT_CATEGORIES.filter((entry) => entry.kind === item.kind && entry.active);

            return (
              <View key={item.id} style={styles.itemCard}>
                {editing ? (
                  <>
                    <TextInput
                      value={editingForm.description}
                      onChangeText={(value) => setEditingForm({ ...editingForm, description: value })}
                      placeholder="Descrição"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                    />
                    <View style={styles.row}>
                      <TextInput
                        value={editingForm.amount}
                        onChangeText={(value) => setEditingForm({ ...editingForm, amount: value })}
                        placeholder="Valor"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        style={[styles.input, styles.col]}
                      />
                      <TextInput
                        value={editingForm.dayOfMonth}
                        onChangeText={(value) => setEditingForm({ ...editingForm, dayOfMonth: value })}
                        placeholder="Dia"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        style={[styles.input, styles.col]}
                      />
                    </View>
                    <View style={styles.chips}>
                      {categories.map((category) => {
                        const active = editingForm.categoryId === category.id;
                        return (
                          <Pressable
                            key={category.id}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setEditingForm({ ...editingForm, categoryId: category.id })}>
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{item.description}</Text>
                      <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                    <Text style={styles.itemMeta}>
                      Dia {item.dayOfMonth} • {item.active ? 'Ativo' : 'Inativo'}
                    </Text>
                  </>
                )}

                <View style={styles.actionRow}>
                  {editing ? (
                    <>
                      <Pressable style={styles.actionButton} onPress={() => onSaveEdit(item)}>
                        <Text style={styles.actionText}>Salvar</Text>
                      </Pressable>
                      <Pressable style={styles.actionButton} onPress={() => setEditingId(null)}>
                        <Text style={styles.actionText}>Cancelar</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable style={styles.actionButton} onPress={() => startEdit(item)}>
                        <Text style={styles.actionText}>Editar</Text>
                      </Pressable>
                      <Pressable style={styles.actionButton} onPress={() => onToggleRecurring(item)}>
                        <Text style={styles.actionText}>{item.active ? 'Desativar' : 'Ativar'}</Text>
                      </Pressable>
                      <Pressable style={styles.actionButtonDanger} onPress={() => onDeleteRecurring(item)}>
                        <Text style={styles.actionTextDanger}>Excluir</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

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
          <Text style={styles.title}>Planejamento</Text>
          <Text style={styles.subtitle}>Recorrências, meta mensal e cartão em um só lugar.</Text>

          {renderRecurringForm('Nova receita recorrente', 'income', incomeForm, setIncomeForm)}
          {renderRecurringForm('Novo gasto fixo', 'expense', expenseForm, setExpenseForm)}

          {renderRecurringList('Receitas recorrentes', recurringIncome)}
          {renderRecurringList('Gastos fixos', recurringExpense)}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Meta mensal</Text>
            <Text style={styles.metaHighlight}>
              {budgetTarget ? formatCurrency(budgetTarget) : 'Sem meta cadastrada'}
            </Text>
            <TextInput
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="Valor da meta"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.actionRow}>
              <Pressable style={styles.buttonPrimary} onPress={onSaveBudget}>
                <Text style={styles.buttonPrimaryText}>Salvar</Text>
              </Pressable>
              <Pressable style={styles.actionButtonDanger} onPress={onDeleteBudget}>
                <Text style={styles.actionTextDanger}>Excluir</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Configuração do cartão</Text>
            <TextInput
              value={cardForm.name}
              onChangeText={(value) => setCardForm((prev) => ({ ...prev, name: value }))}
              placeholder="Nome do cartão"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={styles.row}>
              <TextInput
                value={cardForm.closingDay}
                onChangeText={(value) => setCardForm((prev) => ({ ...prev, closingDay: value }))}
                placeholder="Fechamento"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={[styles.input, styles.col]}
              />
              <TextInput
                value={cardForm.dueDay}
                onChangeText={(value) => setCardForm((prev) => ({ ...prev, dueDay: value }))}
                placeholder="Vencimento"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={[styles.input, styles.col]}
              />
            </View>
            <View style={styles.actionRow}>
              <Pressable style={styles.buttonPrimary} onPress={onSaveCard}>
                <Text style={styles.buttonPrimaryText}>Salvar</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={onResetCard}>
                <Text style={styles.actionText}>Restaurar</Text>
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: bottomInset + Spacing.xxl,
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
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
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
      fontSize: 14,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    col: {
      flex: 1,
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
    buttonPrimary: {
      minHeight: 40,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    buttonPrimaryText: {
      color: isDarkMode ? '#03111B' : '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    list: {
      gap: Spacing.sm,
    },
    itemCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      backgroundColor: colors.surfaceElevated,
      gap: Spacing.xs,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    itemTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    itemAmount: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    itemMeta: {
      color: colors.textMuted,
      fontSize: 12,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    actionButton: {
      minHeight: 34,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    actionButtonDanger: {
      minHeight: 34,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    actionText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    actionTextDanger: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '700',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    metaHighlight: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '700',
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    successText: {
      color: colors.success,
      fontSize: 13,
    },
  });
}
