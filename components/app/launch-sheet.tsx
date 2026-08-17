import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DatePickerField } from '@/components/app/date-picker-field';
import { submitLegacyQuickAdd } from '@/data/legacy/legacy-quick-add-writer';
import { listCategories } from '@/data/local/finance-repository';
import { listCategoriesByUsage, type Category } from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useI18n } from '@/hooks/use-i18n';
import { type LaunchType, useLaunchSheet } from '@/providers/launch-sheet-context';
import {
  formatCurrencyDisplay,
  parseCurrencyDigits,
  sanitizeDigits,
} from '@/utils/currency-input';

interface LaunchForm {
  operationId: string;
  type: LaunchType;
  amount: string;
  description: string;
  date: `${number}-${number}-${number}`;
  categoryId: string;
  installmentTotal: string;
  installmentCurrent: string;
}

let operationSequence = 0;

function createOperationId(): string {
  operationSequence += 1;
  return `quick_${Date.now().toString(36)}_${operationSequence.toString(36)}`;
}

function toIsoToday(date = new Date()): `${number}-${number}-${number}` {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as `${number}-${number}-${number}`;
}

function defaultForm(type: LaunchType = 'gasto'): LaunchForm {
  return {
    operationId: createOperationId(),
    type,
    amount: '',
    description: '',
    date: toIsoToday(),
    categoryId: type === 'receita' ? 'income-salary' : 'expense-other',
    installmentTotal: '1',
    installmentCurrent: '1',
  };
}

export function LaunchSheet() {
  const { isOpen, defaultType, closeSheet, markChanged } = useLaunchSheet();
  const { colors, mode } = useAppTheme();
  const { strings } = useI18n();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';
  const styles = createStyles(colors, isDark);

  const slideAnim = useRef(new Animated.Value(800)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<LaunchForm>(() => defaultForm());
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setForm(defaultForm(defaultType));
      setError(null);
      setSuccess(false);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 11 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 800, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [defaultType, fadeAnim, isOpen, slideAnim]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await listCategories());
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadCategories();
    }
  }, [isOpen, loadCategories]);

  const categoryOptions = useMemo(
    () => listCategoriesByUsage(categories, form.type === 'receita' ? 'income' : 'expense'),
    [categories, form.type]
  );

  useEffect(() => {
    if (!categoryOptions.length || categoryOptions.find((category) => category.id === form.categoryId)) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      categoryId: categoryOptions[0]?.id ?? (prev.type === 'receita' ? 'income-salary' : 'expense-other'),
    }));
  }, [categoryOptions, form.categoryId]);

  const onField = <K extends keyof LaunchForm>(key: K, value: LaunchForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(false);
  };

  const switchType = (type: LaunchType) => {
    setForm(defaultForm(type));
    setError(null);
    setSuccess(false);
  };

  const validate = (): string | null => {
    if (!form.description.trim()) return strings.launch.validationDescription;

    const amount = parseCurrencyDigits(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return strings.launch.validationAmount;
    if (!categoryOptions.find((category) => category.id === form.categoryId)) return strings.launch.validationCategory;

    if (form.type === 'gasto') {
      const total = Number(form.installmentTotal || '1');
      const current = Number(form.installmentCurrent || '1');
      if (!Number.isInteger(total) || total < 1 || total > 36) return strings.launch.validationInstallments;
      if (!Number.isInteger(current) || current < 1 || current > total) return strings.launch.validationInstallmentCurrent;
    }

    return null;
  };

  const onSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const installments = form.type === 'gasto' ? Number(form.installmentTotal || '1') : 1;
      const current = form.type === 'gasto' ? Number(form.installmentCurrent || '1') : 1;
      await submitLegacyQuickAdd.execute({
        operationId: form.operationId,
        kind: form.type === 'receita' ? 'income' as const : 'expense' as const,
        amountCents: Number(sanitizeDigits(form.amount)),
        occurredOn: form.date,
        sourceAccountId: DEFAULT_CARD_CONFIG.id,
        categoryId: form.categoryId,
        description: form.description.trim(),
        notes: undefined,
        installments:
          form.type === 'gasto' && installments > 1
            ? { total: installments, current }
            : undefined,
      });

      markChanged();
      setSuccess(true);
      closeTimerRef.current = setTimeout(closeSheet, 700);
    } catch {
      setError(strings.launch.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  const isExpense = form.type === 'gasto';
  const accent = isExpense ? colors.expense : colors.income;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={closeSheet}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} accessible={false} />
      </Animated.View>
      <Animated.View style={[styles.wrap, { transform: [{ translateY: slideAnim }] }]} pointerEvents="box-none">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
            accessibilityViewIsModal>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{strings.launch.newEntryTitle}</Text>
              <Pressable
                style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
                accessibilityRole="button"
                accessibilityLabel={strings.datePicker.close}
                hitSlop={8}
                onPress={closeSheet}>
                <Text style={[styles.closeText, { color: colors.textSecondary }]}>x</Text>
              </Pressable>
            </View>

            <View style={[styles.toggle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {(['gasto', 'receita'] as LaunchType[]).map((type) => {
                const active = form.type === type;
                const backgroundColor = active ? (type === 'gasto' ? colors.expense : colors.income) : 'transparent';
                return (
                  <Pressable
                    key={type}
                    style={[styles.toggleButton, { backgroundColor }]}
                    accessibilityRole="button"
                    accessibilityLabel={type === 'gasto' ? strings.launch.expense : strings.launch.income}
                    accessibilityState={{ selected: active }}
                    onPress={() => switchType(type)}>
                    <Text style={[styles.toggleText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                      {type === 'gasto' ? `- ${strings.launch.expense}` : `+ ${strings.launch.income}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled">
              <View style={[styles.amountBox, { borderColor: `${accent}45`, backgroundColor: `${accent}0C` }]}>
                <Text style={[styles.amountPrefix, { color: accent }]}>R$</Text>
                <TextInput
                  value={formatCurrencyDisplay(form.amount)}
                  onChangeText={(text) => onField('amount', sanitizeDigits(text))}
                  placeholder={strings.launch.valuePlaceholder}
                  placeholderTextColor={`${accent}50`}
                  keyboardType="number-pad"
                  accessibilityLabel={strings.launch.amount}
                  style={[styles.amountInput, { color: accent }]}
                  maxLength={15}
                  autoFocus
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{strings.launch.description.toUpperCase()}</Text>
                <TextInput
                  value={form.description}
                  onChangeText={(value) => onField('description', value)}
                  placeholder={strings.launch.descriptionPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={strings.launch.description}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary },
                  ]}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.fieldGroup}>
                <DatePickerField label={strings.launch.date.toUpperCase()} value={form.date} onChange={(value) => onField('date', value)} />
              </View>

              {isExpense ? (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{strings.launch.installments.toUpperCase()}</Text>
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Text style={[styles.sublabel, { color: colors.textMuted }]}>{strings.launch.installments}</Text>
                      <TextInput
                        value={form.installmentTotal}
                        onChangeText={(value) => onField('installmentTotal', sanitizeDigits(value))}
                        placeholder={strings.launch.installmentsPlaceholder}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        accessibilityLabel={strings.launch.installments}
                        style={[
                          styles.input,
                          { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary },
                        ]}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={[styles.sublabel, { color: colors.textMuted }]}>{strings.launch.installmentCurrent}</Text>
                      <TextInput
                        value={form.installmentCurrent}
                        onChangeText={(value) => onField('installmentCurrent', sanitizeDigits(value))}
                        placeholder={strings.launch.installmentCurrentPlaceholder}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        accessibilityLabel={strings.launch.installmentCurrent}
                        style={[
                          styles.input,
                          { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary },
                        ]}
                      />
                    </View>
                  </View>
                  {Number(form.installmentTotal) > 1 ? (
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                      {strings.launch.installmentsAutoHint}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{strings.launch.category.toUpperCase()}</Text>
                <View style={styles.chips}>
                  {categoryOptions.map((category) => {
                    const active = form.categoryId === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? accent : colors.surfaceElevated,
                            borderColor: active ? accent : colors.border,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={category.name}
                        accessibilityState={{ selected: active }}
                        onPress={() => onField('categoryId', category.id)}>
                        <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {error ? (
                <View
                  accessibilityRole="alert"
                  style={[styles.feedback, { backgroundColor: `${colors.expense}15`, borderColor: `${colors.expense}40` }]}>
                  <Text style={[styles.feedbackText, { color: colors.expense }]}>{error}</Text>
                </View>
              ) : null}
              {success ? (
                <View
                  accessibilityLiveRegion="polite"
                  style={[styles.feedback, { backgroundColor: `${colors.income}15`, borderColor: `${colors.income}40` }]}>
                  <Text style={[styles.feedbackText, { color: colors.income }]}>{strings.launch.saveSuccessEntry}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.saveButton, { backgroundColor: saving || success ? `${accent}70` : accent }]}
                accessibilityRole="button"
                accessibilityLabel={strings.launch.save}
                accessibilityState={{ disabled: saving || success, busy: saving }}
                onPress={onSave}
                disabled={saving || success}>
                <Text style={styles.saveText}>
                  {saving ? strings.launch.saving : success ? strings.launch.saved : strings.launch.save}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
    wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    sheet: {
      maxHeight: '93%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 12,
      paddingHorizontal: 20,
      backgroundColor: isDark ? '#0F1826' : '#FFFFFF',
    },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    title: { fontSize: 19, fontWeight: '800' },
    closeButton: { minWidth: 48, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    closeText: { fontSize: 13, fontWeight: '700' },
    toggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 3, marginBottom: 18 },
    toggleButton: { flex: 1, minHeight: 48, paddingVertical: 10, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    toggleText: { fontSize: 14, fontWeight: '700' },
    scroll: { gap: 18, paddingBottom: 8 },
    amountBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      borderWidth: 1.5,
      paddingHorizontal: 16,
      paddingVertical: 2,
      gap: 8,
    },
    amountPrefix: { fontSize: 24, fontWeight: '800' },
    amountInput: { flex: 1, fontSize: 40, fontWeight: '800', paddingVertical: 14 },
    fieldGroup: { gap: 7 },
    label: { fontSize: 12, fontWeight: '700' },
    sublabel: { fontSize: 12, fontWeight: '500' },
    input: {
      borderRadius: 13,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      fontWeight: '500',
    },
    row: { flexDirection: 'row', gap: 10 },
    halfField: { flex: 1, gap: 5 },
    hint: { fontSize: 11, lineHeight: 16 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { minHeight: 48, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8, justifyContent: 'center' },
    chipText: { fontSize: 13, fontWeight: '600' },
    feedback: { borderRadius: 12, borderWidth: 1, padding: 13 },
    feedbackText: { fontSize: 13, fontWeight: '500' },
    saveButton: { borderRadius: 15, paddingVertical: 16, alignItems: 'center', marginTop: 2 },
    saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  });
}
