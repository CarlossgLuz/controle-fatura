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
import {
  addInstallmentTransaction,
  addTransaction,
  listCategories,
} from '@/data/local/finance-repository';
import { listCategoriesByUsage, type Category } from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { type LaunchType, useLaunchSheet } from '@/providers/launch-sheet-context';
import {
  formatCurrencyDisplay,
  parseCurrencyDigits,
  sanitizeDigits,
} from '@/utils/currency-input';

interface LaunchForm {
  type: LaunchType;
  amount: string;
  description: string;
  date: `${number}-${number}-${number}`;
  categoryId: string;
  installmentTotal: string;
  installmentCurrent: string;
}

function toIsoToday(date = new Date()): `${number}-${number}-${number}` {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as `${number}-${number}-${number}`;
}

function defaultForm(type: LaunchType = 'gasto'): LaunchForm {
  return {
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
    if (!form.description.trim()) return 'Informe uma descricao.';

    const amount = parseCurrencyDigits(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return 'Informe um valor valido.';
    if (!categoryOptions.find((category) => category.id === form.categoryId)) return 'Selecione uma categoria.';

    if (form.type === 'gasto') {
      const total = Number(form.installmentTotal || '1');
      const current = Number(form.installmentCurrent || '1');
      if (!Number.isInteger(total) || total < 1 || total > 36) return 'Total de parcelas invalido (1-36).';
      if (!Number.isInteger(current) || current < 1 || current > total) return 'Parcela atual invalida.';
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
      const amount = parseCurrencyDigits(form.amount);
      const installments = form.type === 'gasto' ? Number(form.installmentTotal || '1') : 1;
      const current = form.type === 'gasto' ? Number(form.installmentCurrent || '1') : 1;
      const payload = {
        cardId: DEFAULT_CARD_CONFIG.id,
        kind: form.type === 'receita' ? 'income' as const : 'expense' as const,
        amount,
        date: form.date,
        categoryId: form.categoryId,
        description: form.description.trim(),
        notes: undefined,
        recurringEntryId: undefined,
      };

      if (form.type === 'gasto' && installments > 1) {
        await addInstallmentTransaction(payload, installments, current);
      } else {
        await addTransaction(payload);
      }

      markChanged();
      setSuccess(true);
      closeTimerRef.current = setTimeout(closeSheet, 700);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
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
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>
      <Animated.View style={[styles.wrap, { transform: [{ translateY: slideAnim }] }]} pointerEvents="box-none">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Novo lancamento</Text>
              <Pressable style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]} onPress={closeSheet}>
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
                    onPress={() => switchType(type)}>
                    <Text style={[styles.toggleText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                      {type === 'gasto' ? '- Gasto' : '+ Receita'}
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
                  placeholder="0,00"
                  placeholderTextColor={`${accent}50`}
                  keyboardType="number-pad"
                  style={[styles.amountInput, { color: accent }]}
                  maxLength={15}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>DESCRICAO</Text>
                <TextInput
                  value={form.description}
                  onChangeText={(value) => onField('description', value)}
                  placeholder="Ex: Mercado, freela, conta de luz"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary },
                  ]}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.fieldGroup}>
                <DatePickerField label="DATA" value={form.date} onChange={(value) => onField('date', value)} />
              </View>

              {isExpense ? (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>PARCELAMENTO</Text>
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Text style={[styles.sublabel, { color: colors.textMuted }]}>Total de parcelas</Text>
                      <TextInput
                        value={form.installmentTotal}
                        onChangeText={(value) => onField('installmentTotal', sanitizeDigits(value))}
                        placeholder="1"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        style={[
                          styles.input,
                          { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary },
                        ]}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={[styles.sublabel, { color: colors.textMuted }]}>Parcela atual</Text>
                      <TextInput
                        value={form.installmentCurrent}
                        onChangeText={(value) => onField('installmentCurrent', sanitizeDigits(value))}
                        placeholder="1"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        style={[
                          styles.input,
                          { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary },
                        ]}
                      />
                    </View>
                  </View>
                  {Number(form.installmentTotal) > 1 ? (
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                      As parcelas restantes serao criadas automaticamente.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORIA</Text>
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
                <View style={[styles.feedback, { backgroundColor: `${colors.expense}15`, borderColor: `${colors.expense}40` }]}>
                  <Text style={[styles.feedbackText, { color: colors.expense }]}>{error}</Text>
                </View>
              ) : null}
              {success ? (
                <View style={[styles.feedback, { backgroundColor: `${colors.income}15`, borderColor: `${colors.income}40` }]}>
                  <Text style={[styles.feedbackText, { color: colors.income }]}>Lancamento salvo com sucesso.</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.saveButton, { backgroundColor: saving || success ? `${accent}70` : accent }]}
                onPress={onSave}
                disabled={saving || success}>
                <Text style={styles.saveText}>
                  {saving ? 'Salvando...' : success ? 'Salvo' : 'Salvar lancamento'}
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
    closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    closeText: { fontSize: 13, fontWeight: '700' },
    toggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 3, marginBottom: 18 },
    toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
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
    label: { fontSize: 11, fontWeight: '700' },
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
    chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
    chipText: { fontSize: 13, fontWeight: '600' },
    feedback: { borderRadius: 12, borderWidth: 1, padding: 13 },
    feedbackText: { fontSize: 13, fontWeight: '500' },
    saveButton: { borderRadius: 15, paddingVertical: 16, alignItems: 'center', marginTop: 2 },
    saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  });
}
