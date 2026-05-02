import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
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
import { useI18n } from '@/hooks/use-i18n';
import type { AppStrings } from '@/locales/translations';
import {
  formatCurrencyDisplay,
  normalizeCurrencyInput,
  parseCurrencyDigits,
  sanitizeDigits,
  toCentsDigits,
} from '@/utils/currency-input';

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

function categoryMeta(category: Category, strings: AppStrings['planning']): string {
  const kindLabel = category.kind === 'income' ? strings.incomeMeta : strings.expenseMeta;
  const usageLabel =
    category.kind === 'income'
      ? strings.generalMeta
      : category.usage === 'fixed'
        ? strings.fixedMeta
        : category.usage === 'variable'
          ? strings.variableMeta
          : strings.generalMeta;
  const scopeLabel = category.system ? strings.systemMeta : strings.customMeta;
  return `${kindLabel} · ${usageLabel} · ${scopeLabel}`;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export default function PlanejamentoScreen() {
  const params = useLocalSearchParams<{ section?: string; segment?: string }>();
  const { colors, mode } = useAppTheme();
  const { strings, formatCurrency } = useI18n();
  const styles = createStyles(colors, mode === 'dark');
  const planning = strings.planning;

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
      setBudgetInput(budget?.targetAmount ? toCentsDigits(budget.targetAmount) : '');
      setCardForm({
        name: card.name,
        closingDay: String(card.closingDay),
        dueDay: String(card.dueDay),
      });
    } catch {
      setError(planning.loadError);
    } finally {
      setLoading(false);
    }
  }, [planning.loadError]);

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
      ? planning.stateNoGoal
      : budgetProgressRaw < 0.8
        ? planning.stateGood
        : budgetProgressRaw <= 1
          ? planning.stateWarning
          : planning.stateDanger;

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
  const highlightedSection =
    params.section === 'card' || params.section === 'budget' || params.section === 'recurring'
      ? params.section
      : null;

  useEffect(() => {
    if (params.segment === 'income' || params.segment === 'fixed' || params.segment === 'expense') {
      setActiveSegment(params.segment);
    }
  }, [params.segment]);

  const onSaveBudget = async () => {
    const amount = parseCurrencyDigits(budgetInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(planning.budgetInvalid);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await upsertBudgetTarget(toMonthKey(), amount);
      setBudgetTarget(updated.targetAmount);
      setSuccess(planning.budgetSaveSuccess);
    } catch {
      setError(planning.budgetSaveError);
    } finally {
      setSaving(false);
    }
  };

  const onClearBudget = async () => {
    try {
      await clearBudgetConfig();
      setBudgetTarget(null);
      setBudgetInput('');
      setSuccess(planning.budgetClearSuccess);
    } catch {
      setError(planning.budgetClearError);
    }
  };

  const onSaveCard = async () => {
    const closingDay = Number(cardForm.closingDay);
    const dueDay = Number(cardForm.dueDay);

    setSaving(true);
    setError(null);

    try {
      await updateCardConfig({ name: cardForm.name, closingDay, dueDay });
      setSuccess(planning.cardSaveSuccess);
    } catch {
      setError(planning.cardSaveError);
    } finally {
      setSaving(false);
    }
  };

  const onResetCard = async () => {
    try {
      await resetCardConfig();
      await loadData();
      setSuccess(planning.cardRestoreSuccess);
    } catch {
      setError(planning.cardRestoreError);
    }
  };

  const onCreateRecurring = async () => {
    if (!recurringForm.description.trim()) {
      setError(planning.recurringDescriptionRequired);
      return;
    }

    const amount = parseCurrencyDigits(recurringForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(planning.recurringAmountInvalid);
      return;
    }

    const day = Number(recurringForm.dayOfMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setError(planning.recurringDayInvalid);
      return;
    }

    if (!recurringOptions.find((entry) => entry.id === recurringForm.categoryId)) {
      setError(planning.recurringCategoryInvalid);
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
      setSuccess(planning.recurringCreated);
      await loadData();
    } catch {
      setError(planning.recurringCreateError);
    } finally {
      setSaving(false);
    }
  };

  const onToggleRecurring = async (entry: RecurringEntry) => {
    try {
      await setRecurringEntryActive(entry.id, !entry.active);
      await loadData();
      setSuccess(entry.active ? planning.recurringDeactivated : planning.recurringActivated);
    } catch {
      setError(planning.recurringUpdateError);
    }
  };

  const onDeleteRecurring = (entry: RecurringEntry) => {
    Alert.alert(planning.recurringDeleteTitle, planning.recurringDeleteMessage(entry.description), [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: planning.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await removeRecurringEntryById(entry.id);
            await loadData();
            setSuccess(planning.recurringDeleted);
          } catch {
            setError(planning.recurringDeleteError);
          }
        },
      },
    ]);
  };

  const onToggleCategory = async (category: Category) => {
    try {
      await setCategoryActive(category.id, !category.active);
      await loadData();
      setSuccess(category.active ? planning.categoryHidden : planning.categoryReactivated);
    } catch {
      setError(planning.categoryUpdateError);
    }
  };

  const onDeleteCategory = (category: Category) => {
    if (category.system) {
      setError(planning.categorySystemDeleteError);
      return;
    }

    Alert.alert(planning.categoryDeleteTitle, planning.categoryDeleteMessage(category.name), [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: planning.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCustomCategory(category.id);
            await loadData();
            setSuccess(planning.categoryDeleted);
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : planning.categoryDeleteError;
            setError(message);
          }
        },
      },
    ]);
  };

  return (
    <AppScreen keyboardAware>
      <AppHeader
        eyebrow={planning.eyebrow}
        title={planning.title}
        subtitle={planning.subtitle}
      />

      {loading ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>{planning.loading}</Text>
        </View>
      ) : null}

      {!loading ? (
        <>
          <View style={[styles.goalCard, highlightedSection === 'budget' && styles.targetedCard]}>
            <SectionHeader title={planning.budgetTitle} subtitle={planning.budgetSubtitle} iconName="target" />
            <View style={styles.goalValueCard}>
              <Text style={[styles.bigValue, !budgetTarget && styles.bigValueMuted]}>
                {budgetTarget ? formatCurrency(budgetTarget) : planning.budgetEmpty}
              </Text>
            </View>
            <View style={styles.goalSummaryRow}>
              <Text style={styles.goalMeta}>{planning.budgetSpent(formatCurrency(monthExpense))}</Text>
              <Text
                style={[
                  styles.goalState,
                  budgetState === planning.stateGood
                    ? styles.goalStateGood
                    : budgetState === planning.stateWarning
                      ? styles.goalStateWarning
                      : budgetState === planning.stateDanger
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
                  {
                    width:
                      budgetTarget && budgetProgress > 0
                        ? `${Math.max(6, Math.round(budgetProgress * 100))}%`
                        : '0%',
                  },
                  budgetState === planning.stateGood
                    ? styles.goalFillGood
                    : budgetState === planning.stateWarning
                      ? styles.goalFillWarning
                      : budgetState === planning.stateDanger
                        ? styles.goalFillDanger
                        : styles.goalFillDefault,
                ]}
              />
            </View>
            {budgetTarget ? <Text style={styles.goalPercent}>{planning.budgetPercent(budgetProgressPercent)}</Text> : null}
            <Text style={styles.fieldLabel}>{planning.budgetValue}</Text>
            <TextInput
              value={formatCurrencyDisplay(budgetInput)}
              onChangeText={(value) => setBudgetInput(normalizeCurrencyInput(value))}
              placeholder={planning.budgetValue}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.row}>
              <Pressable style={styles.primaryButton} onPress={onSaveBudget} disabled={saving}>
                <Text style={styles.primaryButtonText}>{planning.budgetSave}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onClearBudget}>
                <Text style={styles.secondaryButtonText}>{planning.budgetClear}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.card, highlightedSection === 'card' && styles.targetedCard]}>
            <SectionHeader title={planning.cardTitle} subtitle={planning.cardSubtitle} iconName="creditcard.fill" />
            <Text style={styles.fieldLabel}>{planning.cardName}</Text>
            <TextInput
              value={cardForm.name}
              onChangeText={(value) => setCardForm((prev) => ({ ...prev, name: value }))}
              placeholder={planning.cardName}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={styles.row}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{planning.cardClosingDay}</Text>
                <TextInput
                  value={cardForm.closingDay}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, closingDay: sanitizeDigits(value) }))}
                  placeholder={planning.cardClosingPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{planning.cardDueDay}</Text>
                <TextInput
                  value={cardForm.dueDay}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, dueDay: sanitizeDigits(value) }))}
                  placeholder={planning.cardDuePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.row}>
              <Pressable style={styles.primaryButton} onPress={onSaveCard} disabled={saving}>
                <Text style={styles.primaryButtonText}>{planning.cardSave}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onResetCard}>
                <Text style={styles.secondaryButtonText}>{planning.cardRestore}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.card, highlightedSection === 'recurring' && styles.targetedCard]}>
            <SectionHeader title={planning.recurringTitle} subtitle={planning.recurringSubtitle} iconName="arrow.clockwise.circle.fill" />

            <View style={styles.typeRow}>
              {(['income', 'fixed', 'expense'] as RecurringCreateType[]).map((type) => {
                const active = recurringForm.type === type;
                const label = type === 'income' ? planning.income : type === 'fixed' ? planning.fixed : planning.expense;
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

            <Text style={styles.fieldLabel}>{planning.description}</Text>
            <TextInput
              value={recurringForm.description}
              onChangeText={(value) => setRecurringForm((prev) => ({ ...prev, description: value }))}
              placeholder={planning.description}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={styles.row}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{planning.amount}</Text>
                <TextInput
              value={formatCurrencyDisplay(recurringForm.amount)}
                  onChangeText={(value) =>
                    setRecurringForm((prev) => ({ ...prev, amount: normalizeCurrencyInput(value) }))
                  }
                  placeholder={planning.amount}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.dayGroup}>
                <Text style={styles.fieldLabel}>{planning.dayOfMonth}</Text>
                <TextInput
                  value={recurringForm.dayOfMonth}
                  onChangeText={(value) => setRecurringForm((prev) => ({ ...prev, dayOfMonth: sanitizeDigits(value) }))}
                  placeholder={planning.dayOfMonth}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>{planning.categorySection}</Text>
            {recurringOptions.length === 0 ? (
              <EmptyState title={planning.categoryCreateEmptyTitle} description={planning.categoryCreateEmptyDescription} />
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
              <Text style={styles.primaryButtonText}>{planning.recurringAdd}</Text>
            </Pressable>

            <View style={styles.segmentRow}>
              {(['income', 'fixed', 'expense'] as RecurringSegment[]).map((segment) => {
                const active = activeSegment === segment;
                const label = segment === 'income' ? strings.home.income : segment === 'fixed' ? strings.insights.fixedLabel : strings.home.expense;
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
              <EmptyState title={planning.recurringEmptyTitle} description={planning.recurringEmptyDescription} />
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
                        {planning.monthlyDay(entry.dayOfMonth)}
                      </Text>
                      {!entry.active ? (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>{planning.inactive}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.row}>
                      <Pressable style={styles.secondaryButton} onPress={() => onToggleRecurring(entry)}>
                        <Text style={styles.secondaryButtonText}>{entry.active ? planning.deactivate : planning.activate}</Text>
                      </Pressable>
                      <Pressable style={styles.dangerButton} onPress={() => onDeleteRecurring(entry)}>
                        <Text style={styles.dangerText}>{planning.delete}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader title={planning.categorySection} subtitle={planning.categoryManagementSubtitle} iconName="pin.fill" />
            {categoriesForManagement.length === 0 ? (
              <EmptyState title={planning.categoryEmptyTitle} description={planning.categoryEmptyDescription} />
            ) : (
              <View style={styles.list}>
                {categoriesForManagement.map((category) => (
                  <View key={category.id} style={[styles.categoryRow, !category.active && styles.categoryRowInactive]}>
                    <View style={styles.categoryMain}>
                      <Text style={[styles.categoryName, !category.active && styles.categoryNameInactive]}>
                        {category.name}
                      </Text>
                      <Text style={styles.categoryMeta}>{categoryMeta(category, planning)}</Text>
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
                        <Text style={styles.categoryActionText}>{category.active ? planning.hide : planning.activate}</Text>
                      </Pressable>

                      {!category.system ? (
                        <Pressable
                          style={[styles.categoryActionButton, styles.categoryActionDanger]}
                          onPress={() => onDeleteCategory(category)}>
                          <IconSymbol name="trash.fill" size={14} color={colors.expense} />
                          <Text style={styles.categoryActionDangerText}>{planning.delete}</Text>
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      gap: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      gap: 12,
    },
    targetedCard: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated,
    },
    loadingCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    bigValue: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '800',
    },
    bigValueMuted: {
      color: colors.textSecondary,
      fontSize: 24,
      fontWeight: '700',
    },
    goalValueCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
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
      minHeight: 48,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.lg,
      color: colors.textPrimary,
      fontSize: 15,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
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
      minHeight: 42,
      borderRadius: Radius.lg,
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
      minHeight: 44,
      borderRadius: Radius.lg,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryButton: {
      minHeight: 42,
      borderRadius: Radius.lg,
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
      minHeight: 42,
      borderRadius: Radius.lg,
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
      minHeight: 38,
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
      borderRadius: Radius.lg,
      backgroundColor: colors.surfaceElevated,
      padding: Spacing.md,
      gap: Spacing.sm,
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
      borderRadius: Radius.lg,
      backgroundColor: colors.surfaceElevated,
      padding: Spacing.md,
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
      minHeight: 34,
      borderRadius: Radius.md,
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
      textAlign: 'center',
    },
    successText: {
      color: colors.income,
      fontSize: 13,
      textAlign: 'center',
    },
  });
}
