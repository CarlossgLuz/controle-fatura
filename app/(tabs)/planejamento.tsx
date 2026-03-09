import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader, AppScreen, CategoryQuickAdd, EmptyState, SectionHeader } from '@/components/app';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { getHomeDashboardSnapshot } from '@/data/local/home-dashboard';
import {
  addRecurringEntry,
  clearBudgetConfig,
  createCustomCategory,
  getBudgetConfig,
  getCardConfig,
  listCategories,
  listRecurringEntries,
  removeCustomCategory,
  removeRecurringEntryById,
  resetCardConfig,
  setCategoryActive,
  setRecurringEntryActive,
  updateCardConfig,
  upsertBudgetTarget,
} from '@/data/local/finance-repository';
import { listCategoriesByUsage, type Category, type RecurringEntry } from '@/domain/finance';
import { useAppTheme } from '@/hooks/use-app-theme';

type RecurringCreateType = 'income' | 'fixed' | 'expense';
type RecurringSegment = 'income' | 'fixed' | 'expense';

interface RecurringForm {
  type: RecurringCreateType;
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

function usageFromRecurringType(type: RecurringCreateType): 'income' | 'expense' | 'fixed' {
  if (type === 'income') return 'income';
  if (type === 'fixed') return 'fixed';
  return 'expense';
}

function kindFromRecurringType(type: RecurringCreateType): 'income' | 'expense' {
  return type === 'income' ? 'income' : 'expense';
}

function defaultRecurringForm(type: RecurringCreateType = 'fixed'): RecurringForm {
  return {
    type,
    description: '',
    amount: '',
    dayOfMonth: String(new Date().getDate()),
    categoryId: type === 'income' ? 'income-salary' : 'expense-other',
  };
}

function categoryMeta(category: Category): string {
  const kindLabel = category.kind === 'income' ? 'Entrada' : 'Saída';
  const usageLabel =
    category.kind === 'income'
      ? 'geral'
      : category.usage === 'fixed'
        ? 'fixo'
        : category.usage === 'variable'
          ? 'variável'
          : 'geral';
  const scopeLabel = category.system ? 'padrão' : 'custom';
  return `${kindLabel} · ${usageLabel} · ${scopeLabel}`;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export default function PlanejamentoScreen() {
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, mode === 'dark');

  const [entries, setEntries] = useState<RecurringEntry[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [budgetTarget, setBudgetTarget] = useState<number | null>(null);
  const [monthExpense, setMonthExpense] = useState(0);
  const [budgetInput, setBudgetInput] = useState('');
  const [cardForm, setCardForm] = useState<CardForm>({ name: '', closingDay: '5', dueDay: '8' });
  const [recurringForm, setRecurringForm] = useState<RecurringForm>(() => defaultRecurringForm());
  const [activeSegment, setActiveSegment] = useState<RecurringSegment>('income');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [recurring, budget, card, allCategoriesData, home] = await Promise.all([
        listRecurringEntries(),
        getBudgetConfig(),
        getCardConfig(),
        listCategories({ includeInactive: true }),
        getHomeDashboardSnapshot(new Date()),
      ]);

      setEntries(recurring);
      setAllCategories(allCategoriesData);
      setBudgetTarget(budget?.targetAmount ?? null);
      setMonthExpense(home.monthExpense);
      setBudgetInput(budget?.targetAmount ? String(budget.targetAmount).replace('.', ',') : '');
      setCardForm({
        name: card.name,
        closingDay: String(card.closingDay),
        dueDay: String(card.dueDay),
      });
    } catch {
      setError('Não foi possível carregar o planejamento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const categories = useMemo(() => allCategories.filter((entry) => entry.active), [allCategories]);
  const categoriesForManagement = useMemo(
    () =>
      [...allCategories].sort((a, b) => {
        if (a.system === b.system) return a.name.localeCompare(b.name);
        return a.system ? -1 : 1;
      }),
    [allCategories]
  );

  const budgetProgressRaw = budgetTarget && budgetTarget > 0 ? monthExpense / budgetTarget : 0;
  const budgetProgress = clampProgress(budgetProgressRaw);
  const budgetProgressPercent = Math.round(Math.max(0, budgetProgressRaw) * 100);
  const budgetState =
    !budgetTarget || budgetTarget <= 0
      ? 'Sem meta'
      : budgetProgressRaw < 0.8
        ? 'No limite'
        : budgetProgressRaw <= 1
          ? 'Atenção'
          : 'Acima da meta';

  const recurringOptions = useMemo(
    () => listCategoriesByUsage(categories, usageFromRecurringType(recurringForm.type)),
    [categories, recurringForm.type]
  );

  const customRecurringOptions = useMemo(
    () =>
      recurringOptions
        .filter((entry) => !entry.system)
        .map((entry) => ({ id: entry.id, name: entry.name })),
    [recurringOptions]
  );

  useEffect(() => {
    if (!recurringOptions.find((entry) => entry.id === recurringForm.categoryId)) {
      const fallback =
        recurringOptions[0]?.id ??
        (recurringForm.type === 'income' ? 'income-salary' : 'expense-other');
      setRecurringForm((prev) => ({ ...prev, categoryId: fallback }));
    }
  }, [recurringForm.categoryId, recurringForm.type, recurringOptions]);

  const groupedEntries = useMemo(() => {
    const fixed = entries.filter(
      (entry) =>
        entry.kind === 'expense' &&
        (allCategories.find((category) => category.id === entry.categoryId)?.usage ?? 'all') !== 'variable'
    );

    const expense = entries.filter(
      (entry) =>
        entry.kind === 'expense' &&
        (allCategories.find((category) => category.id === entry.categoryId)?.usage ?? 'all') === 'variable'
    );

    const income = entries.filter((entry) => entry.kind === 'income');

    return { income, fixed, expense };
  }, [allCategories, entries]);

  const visibleEntries = groupedEntries[activeSegment];

  const onSaveBudget = async () => {
    const amount = parseAmount(budgetInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe uma meta mensal válida.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await upsertBudgetTarget(toMonthKey(), amount);
      setBudgetTarget(updated.targetAmount);
      setSuccess('Meta mensal salva.');
    } catch {
      setError('Não foi possível salvar a meta.');
    } finally {
      setSaving(false);
    }
  };

  const onClearBudget = async () => {
    try {
      await clearBudgetConfig();
      setBudgetTarget(null);
      setBudgetInput('');
      setSuccess('Meta mensal removida.');
    } catch {
      setError('Não foi possível remover a meta.');
    }
  };

  const onSaveCard = async () => {
    const closingDay = Number(cardForm.closingDay);
    const dueDay = Number(cardForm.dueDay);

    setSaving(true);
    setError(null);

    try {
      await updateCardConfig({ name: cardForm.name, closingDay, dueDay });
      setSuccess('Configuração do cartão salva.');
    } catch {
      setError('Não foi possível salvar as configurações do cartão.');
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
      setError('Não foi possível restaurar o cartão.');
    }
  };

  const onCreateRecurring = async () => {
    if (!recurringForm.description.trim()) {
      setError('Descrição da recorrência é obrigatória.');
      return;
    }

    const amount = parseAmount(recurringForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor válido para a recorrência.');
      return;
    }

    const day = Number(recurringForm.dayOfMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setError('Dia do mês inválido para recorrência.');
      return;
    }

    if (!recurringOptions.find((entry) => entry.id === recurringForm.categoryId)) {
      setError('Selecione uma categoria válida para esta recorrência.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addRecurringEntry({
        cardId: 'card-main',
        kind: kindFromRecurringType(recurringForm.type),
        amount,
        dayOfMonth: day,
        categoryId: recurringForm.categoryId,
        description: recurringForm.description.trim(),
        startMonth: toMonthKey(),
        endMonth: undefined,
        notes: undefined,
      });

      setRecurringForm(defaultRecurringForm(recurringForm.type));
      setSuccess('Recorrência criada.');
      await loadData();
    } catch {
      setError('Não foi possível criar a recorrência.');
    } finally {
      setSaving(false);
    }
  };

  const onToggleRecurring = async (entry: RecurringEntry) => {
    try {
      await setRecurringEntryActive(entry.id, !entry.active);
      await loadData();
      setSuccess(entry.active ? 'Recorrência desativada.' : 'Recorrência ativada.');
    } catch {
      setError('Não foi possível atualizar a recorrência.');
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
            await loadData();
            setSuccess('Recorrência excluída.');
          } catch {
            setError('Não foi possível excluir a recorrência.');
          }
        },
      },
    ]);
  };

  const onToggleCategory = async (category: Category) => {
    try {
      await setCategoryActive(category.id, !category.active);
      await loadData();
      setSuccess(category.active ? 'Categoria ocultada.' : 'Categoria reativada.');
    } catch {
      setError('Não foi possível atualizar a categoria.');
    }
  };

  const onDeleteCategory = (category: Category) => {
    if (category.system) {
      setError('Categorias padrão não podem ser excluídas. Use ocultar.');
      return;
    }

    Alert.alert('Excluir categoria', `Deseja excluir "${category.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCustomCategory(category.id);
            await loadData();
            setSuccess('Categoria removida.');
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : 'Não foi possível excluir a categoria.';
            setError(message);
          }
        },
      },
    ]);
  };

  return (
    <AppScreen keyboardAware>
      <AppHeader
        eyebrow="Controle do mês"
        title="Planejamento"
        subtitle="Meta, cartão e recorrentes com estrutura simples."
      />

      {loading ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando planejamento...</Text>
        </View>
      ) : null}

      {!loading ? (
        <>
          <View style={styles.goalCard}>
            <SectionHeader title="Meta mensal" subtitle="Card principal do mês" iconName="target" />
            <Text style={styles.bigValue}>{budgetTarget ? formatCurrency(budgetTarget) : 'Sem meta mensal'}</Text>
            <View style={styles.goalSummaryRow}>
              <Text style={styles.goalMeta}>Gasto atual: {formatCurrency(monthExpense)}</Text>
              <Text
                style={[
                  styles.goalState,
                  budgetState === 'No limite'
                    ? styles.goalStateGood
                    : budgetState === 'Atenção'
                      ? styles.goalStateWarning
                      : budgetState === 'Acima da meta'
                        ? styles.goalStateDanger
                        : styles.goalStateMuted,
                ]}>
                {budgetState}
              </Text>
            </View>
            <View style={styles.goalTrack}>
              <View
                style={[
                  styles.goalFill,
                  { width: budgetTarget ? `${Math.max(6, Math.round(budgetProgress * 100))}%` : '0%' },
                  budgetState === 'No limite'
                    ? styles.goalFillGood
                    : budgetState === 'Atenção'
                      ? styles.goalFillWarning
                      : budgetState === 'Acima da meta'
                        ? styles.goalFillDanger
                        : styles.goalFillDefault,
                ]}
              />
            </View>
            {budgetTarget ? <Text style={styles.goalPercent}>{budgetProgressPercent}% da meta</Text> : null}
            <Text style={styles.fieldLabel}>Valor da meta</Text>
            <TextInput
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="Valor da meta"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.row}>
              <Pressable style={styles.primaryButton} onPress={onSaveBudget} disabled={saving}>
                <Text style={styles.primaryButtonText}>Salvar meta</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onClearBudget}>
                <Text style={styles.secondaryButtonText}>Limpar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Cartão" subtitle="Fechamento e vencimento" iconName="creditcard.fill" />
            <Text style={styles.fieldLabel}>Nome do cartão</Text>
            <TextInput
              value={cardForm.name}
              onChangeText={(value) => setCardForm((prev) => ({ ...prev, name: value }))}
              placeholder="Nome do cartão"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={styles.row}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Dia de fechamento</Text>
                <TextInput
                  value={cardForm.closingDay}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, closingDay: value }))}
                  placeholder="Fechamento"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Dia de vencimento</Text>
                <TextInput
                  value={cardForm.dueDay}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, dueDay: value }))}
                  placeholder="Vencimento"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.row}>
              <Pressable style={styles.primaryButton} onPress={onSaveCard} disabled={saving}>
                <Text style={styles.primaryButtonText}>Salvar cartão</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onResetCard}>
                <Text style={styles.secondaryButtonText}>Restaurar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Recorrentes" subtitle="Criação e gestão" iconName="arrow.clockwise.circle.fill" />

            <View style={styles.typeRow}>
              {(['income', 'fixed', 'expense'] as RecurringCreateType[]).map((type) => {
                const active = recurringForm.type === type;
                const label = type === 'income' ? 'Receita' : type === 'fixed' ? 'Fixo' : 'Gasto';
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() =>
                      setRecurringForm((prev) => ({
                        ...defaultRecurringForm(type),
                        dayOfMonth: prev.dayOfMonth,
                      }))
                    }>
                    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              value={recurringForm.description}
              onChangeText={(value) => setRecurringForm((prev) => ({ ...prev, description: value }))}
              placeholder="Descrição"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={styles.row}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Valor</Text>
                <TextInput
                  value={recurringForm.amount}
                  onChangeText={(value) => setRecurringForm((prev) => ({ ...prev, amount: value }))}
                  placeholder="Valor"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.dayGroup}>
                <Text style={styles.fieldLabel}>Dia do mês</Text>
                <TextInput
                  value={recurringForm.dayOfMonth}
                  onChangeText={(value) => setRecurringForm((prev) => ({ ...prev, dayOfMonth: value }))}
                  placeholder="Dia"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Categoria</Text>
            {recurringOptions.length === 0 ? (
              <EmptyState title="Sem categorias" description="Crie uma categoria para continuar." />
            ) : (
              <View style={styles.chips}>
                <CategoryQuickAdd
                  triggerMode="chip"
                  kind={recurringForm.type === 'income' ? 'income' : 'expense'}
                  usage={
                    recurringForm.type === 'income' ? 'all' : recurringForm.type === 'fixed' ? 'fixed' : 'variable'
                  }
                  onSave={async (name, kind, usage) => {
                    const created = await createCustomCategory({ name, kind, usage });
                    await loadData();
                    setRecurringForm((prev) => ({ ...prev, categoryId: created.id }));
                  }}
                  customCategories={customRecurringOptions}
                  onRemove={async (categoryId) => {
                    await removeCustomCategory(categoryId);
                    await loadData();
                    if (recurringForm.categoryId === categoryId) {
                      setRecurringForm((prev) => ({ ...prev, categoryId: '' }));
                    }
                  }}
                />
                {recurringOptions.map((category) => {
                  const active = recurringForm.categoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setRecurringForm((prev) => ({ ...prev, categoryId: category.id }))}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.primaryButton} onPress={onCreateRecurring} disabled={saving}>
              <Text style={styles.primaryButtonText}>Adicionar recorrência</Text>
            </Pressable>

            <View style={styles.segmentRow}>
              {(['income', 'fixed', 'expense'] as RecurringSegment[]).map((segment) => {
                const active = activeSegment === segment;
                const label = segment === 'income' ? 'Receitas' : segment === 'fixed' ? 'Fixos' : 'Gastos';
                return (
                  <Pressable
                    key={segment}
                    style={[styles.segmentChip, active && styles.segmentChipActive]}
                    onPress={() => setActiveSegment(segment)}>
                    <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {visibleEntries.length === 0 ? (
              <EmptyState title="Sem recorrentes" description="Cadastre uma recorrência para começar." />
            ) : (
              <View style={styles.list}>
                {visibleEntries.map((entry) => (
                  <View key={entry.id} style={[styles.itemCard, !entry.active && styles.itemCardInactive]}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, !entry.active && styles.itemTitleInactive]}>
                        {entry.description}
                      </Text>
                      <Text
                        style={[
                          styles.itemAmount,
                          { color: entry.kind === 'income' ? colors.income : colors.expense },
                          !entry.active && styles.itemAmountInactive,
                        ]}>
                        {formatCurrency(entry.amount)}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={[styles.itemMeta, !entry.active && styles.itemMetaInactive]}>
                        Mensal · Dia {entry.dayOfMonth}
                      </Text>
                      {!entry.active ? (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>Desativada</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.row}>
                      <Pressable style={styles.secondaryButton} onPress={() => onToggleRecurring(entry)}>
                        <Text style={styles.secondaryButtonText}>{entry.active ? 'Desativar' : 'Ativar'}</Text>
                      </Pressable>
                      <Pressable style={styles.dangerButton} onPress={() => onDeleteRecurring(entry)}>
                        <Text style={styles.dangerText}>Excluir</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader title="Categorias" subtitle="Ocultar, reativar e excluir com segurança" iconName="pin.fill" />
            {categoriesForManagement.length === 0 ? (
              <EmptyState title="Sem categorias" description="Crie categorias para personalizar o fluxo." />
            ) : (
              <View style={styles.list}>
                {categoriesForManagement.map((category) => (
                  <View key={category.id} style={[styles.categoryRow, !category.active && styles.categoryRowInactive]}>
                    <View style={styles.categoryMain}>
                      <Text style={[styles.categoryName, !category.active && styles.categoryNameInactive]}>
                        {category.name}
                      </Text>
                      <Text style={styles.categoryMeta}>{categoryMeta(category)}</Text>
                    </View>

                    <View style={styles.categoryActions}>
                      <Pressable
                        style={styles.categoryActionButton}
                        onPress={() => onToggleCategory(category)}>
                        <IconSymbol
                          name={category.active ? 'eye.slash.fill' : 'eye.fill'}
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.categoryActionText}>{category.active ? 'Ocultar' : 'Ativar'}</Text>
                      </Pressable>

                      {!category.system ? (
                        <Pressable
                          style={[styles.categoryActionButton, styles.categoryActionDanger]}
                          onPress={() => onDeleteCategory(category)}>
                          <IconSymbol name="trash.fill" size={14} color={colors.expense} />
                          <Text style={styles.categoryActionDangerText}>Excluir</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

        </>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDarkMode: boolean) {
  return StyleSheet.create({
    goalCard: {
      backgroundColor: `${colors.primary}10`,
      borderColor: `${colors.primary}40`,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    loadingCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.lg,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    bigValue: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '700',
    },
    goalSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    goalMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      flex: 1,
    },
    goalState: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    goalStateGood: {
      color: colors.income,
    },
    goalStateWarning: {
      color: colors.warning,
    },
    goalStateDanger: {
      color: colors.expense,
    },
    goalStateMuted: {
      color: colors.textMuted,
    },
    goalTrack: {
      height: 9,
      borderRadius: Radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    goalFill: {
      height: '100%',
    },
    goalFillGood: {
      backgroundColor: colors.income,
    },
    goalFillWarning: {
      backgroundColor: colors.warning,
    },
    goalFillDanger: {
      backgroundColor: colors.expense,
    },
    goalFillDefault: {
      backgroundColor: colors.primary,
    },
    goalPercent: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    fieldGroup: {
      flex: 1,
      minWidth: 138,
      gap: Spacing.xs,
    },
    dayGroup: {
      width: 110,
      gap: Spacing.xs,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      color: colors.textPrimary,
      fontSize: 14,
      paddingHorizontal: Spacing.md,
      paddingVertical: 11,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    typeRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    typeChip: {
      flex: 1,
      minHeight: 38,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    typeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    typeChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    typeChipTextActive: {
      color: isDarkMode ? '#09111D' : '#FFFFFF',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
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
      color: isDarkMode ? '#09111D' : '#FFFFFF',
    },
    primaryButton: {
      minHeight: 40,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    secondaryButton: {
      minHeight: 38,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    dangerButton: {
      minHeight: 38,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.expense,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    dangerText: {
      color: colors.expense,
      fontSize: 12,
      fontWeight: '700',
    },
    segmentRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    segmentChip: {
      flex: 1,
      minHeight: 34,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    segmentChipText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    segmentChipTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    list: {
      gap: Spacing.sm,
    },
    itemCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceElevated,
      padding: Spacing.sm,
      gap: Spacing.xs,
    },
    itemCardInactive: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      opacity: 0.86,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    itemTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    itemTitleInactive: {
      color: colors.textMuted,
    },
    itemAmount: {
      fontSize: 14,
      fontWeight: '700',
    },
    itemAmountInactive: {
      color: colors.textMuted,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    itemMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      flex: 1,
    },
    itemMetaInactive: {
      color: colors.textMuted,
    },
    inactiveBadge: {
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    inactiveBadgeText: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    categoryRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceElevated,
      padding: Spacing.sm,
      gap: Spacing.sm,
    },
    categoryRowInactive: {
      backgroundColor: colors.background,
    },
    categoryMain: {
      gap: 2,
    },
    categoryName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    categoryNameInactive: {
      color: colors.textMuted,
    },
    categoryMeta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    categoryActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    categoryActionButton: {
      minHeight: 32,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    categoryActionDanger: {
      borderColor: `${colors.expense}66`,
    },
    categoryActionText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    categoryActionDangerText: {
      color: colors.expense,
      fontSize: 11,
      fontWeight: '700',
    },
    errorText: {
      color: colors.expense,
      fontSize: 13,
    },
    successText: {
      color: colors.income,
      fontSize: 13,
    },
  });
}
