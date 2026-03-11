import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useAppTheme } from '@/hooks/use-app-theme';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: `${number}-${number}-${number}`) => void;
}

function toIsoDate(date: Date): `${number}-${number}-${number}` {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as `${number}-${number}-${number}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const { colors } = useAppTheme();
  const { language, strings, formatMonthLabel, formatIsoDate } = useI18n();
  const styles = createStyles(colors, language !== 'en');

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const monthLabel = formatMonthLabel(cursor);

  const gridDates = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const days: Date[] = [];

    const startPad = start.getDay();
    for (let i = 0; i < startPad; i += 1) {
      days.push(new Date(start.getFullYear(), start.getMonth(), i - startPad + 1));
    }

    for (let day = 1; day <= end.getDate(); day += 1) {
      days.push(new Date(start.getFullYear(), start.getMonth(), day));
    }

    const tail = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= tail; i += 1) {
      days.push(new Date(end.getFullYear(), end.getMonth(), end.getDate() + i));
    }

    return days;
  }, [cursor]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.fieldText}>{formatIsoDate(value)}</Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{strings.datePicker.selectDate}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.modalClose}>{strings.datePicker.close}</Text>
              </Pressable>
            </View>

            <View style={styles.monthRow}>
              <Pressable
                style={styles.monthButton}
                onPress={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                <Text style={styles.monthButtonText}>{'<'}</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Pressable
                style={styles.monthButton}
                onPress={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                <Text style={styles.monthButtonText}>{'>'}</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {strings.datePicker.weekDays.map((day) => (
                <Text key={day} style={styles.weekText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {gridDates.map((date) => {
                const inMonth = date.getMonth() === cursor.getMonth();
                const selected = sameDay(date, selectedDate);

                return (
                  <Pressable
                    key={date.toISOString()}
                    onPress={() => {
                      onChange(toIsoDate(date));
                      setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
                      setOpen(false);
                    }}
                    style={[styles.day, selected && styles.daySelected]}>
                    <Text style={[styles.dayText, !inMonth && styles.dayTextMuted, selected && styles.dayTextSelected]}>
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.todayButton}
              onPress={() => {
                const today = new Date();
                onChange(toIsoDate(today));
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setOpen(false);
              }}>
              <Text style={styles.todayText}>{strings.datePicker.today}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], capitalizeMonth: boolean) {
  return StyleSheet.create({
    container: {
      gap: Spacing.xs,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: Spacing.xs,
    },
    field: {
      minHeight: 46,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    fieldText: {
      color: colors.textPrimary,
      fontSize: 15,
    },
    overlay: {
      flex: 1,
      backgroundColor: '#00000066',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    modalCard: {
      width: '100%',
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    modalClose: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    monthButton: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    monthButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    monthTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      textTransform: capitalizeMonth ? 'capitalize' : undefined,
    },
    weekRow: {
      flexDirection: 'row',
      marginTop: 2,
    },
    weekText: {
      width: '14.2857%',
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 11,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    day: {
      width: '14.2857%',
      aspectRatio: 1,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    daySelected: {
      backgroundColor: colors.primary,
    },
    dayText: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '600',
      textAlign: 'center',
      includeFontPadding: false,
    },
    dayTextMuted: {
      color: colors.textMuted,
    },
    dayTextSelected: {
      color: '#FFFFFF',
    },
    todayButton: {
      alignSelf: 'flex-end',
      minHeight: 34,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    todayText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
