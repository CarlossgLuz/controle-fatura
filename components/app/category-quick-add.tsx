import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type CategoryKind = 'income' | 'expense';
type CategoryUsage = 'all' | 'fixed' | 'variable';
type CategoryOption = { id: string; name: string };

interface CategoryQuickAddProps {
  kind: CategoryKind;
  usage: CategoryUsage;
  onSave: (name: string, kind: CategoryKind, usage: CategoryUsage) => Promise<void>;
  customCategories?: CategoryOption[];
  onRemove?: (categoryId: string) => Promise<void>;
  triggerMode?: 'button' | 'chip';
}

export function CategoryQuickAdd({
  kind,
  usage,
  onSave,
  customCategories = [],
  onRemove,
  triggerMode = 'button',
}: CategoryQuickAddProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Pressable
        style={triggerMode === 'chip' ? styles.triggerChip : styles.trigger}
        onPress={() => setOpen(true)}>
        <Text style={triggerMode === 'chip' ? styles.triggerChipText : styles.triggerText}>
          + Criar categoria
        </Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>Nova categoria</Text>
            <Text style={styles.subtitle}>
              {kind === 'income' ? 'Receita' : usage === 'fixed' ? 'Fixo' : 'Gasto'}
            </Text>

            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError(null);
              }}
              placeholder="Nome da categoria"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {customCategories.length > 0 ? (
              <View style={styles.customList}>
                <Text style={styles.customTitle}>Categorias customizadas</Text>
                {customCategories.map((category) => (
                  <View key={category.id} style={styles.customItem}>
                    <Text style={styles.customItemText}>{category.name}</Text>
                    {onRemove ? (
                      <Pressable
                        onPress={async () => {
                          setError(null);
                          setRemovingId(category.id);
                          try {
                            await onRemove(category.id);
                          } catch (cause) {
                            const message = cause instanceof Error ? cause.message : 'Não foi possível remover.';
                            setError(message);
                          } finally {
                            setRemovingId(null);
                          }
                        }}
                        style={styles.removeButton}
                        disabled={removingId === category.id}>
                        <Text style={styles.removeText}>
                          {removingId === category.id ? '...' : 'Remover'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.row}>
              <Pressable style={styles.secondary} onPress={() => setOpen(false)}>
                <Text style={styles.secondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.primary, saving && styles.disabled]}
                disabled={saving}
                onPress={async () => {
                  if (!name.trim()) {
                    setError('Nome é obrigatório.');
                    return;
                  }

                  setSaving(true);
                  try {
                    await onSave(name, kind, usage);
                    setName('');
                    setOpen(false);
                  } catch {
                    setError('Não foi possível salvar agora.');
                  } finally {
                    setSaving(false);
                  }
                }}>
                <Text style={styles.primaryText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    trigger: {
      alignSelf: 'flex-start',
      minHeight: 34,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    triggerText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    triggerChip: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    triggerChipText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
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
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    input: {
      minHeight: 44,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      color: colors.textPrimary,
      paddingHorizontal: Spacing.md,
      fontSize: 14,
    },
    error: {
      color: colors.expense,
      fontSize: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.sm,
    },
    customList: {
      gap: Spacing.xs,
    },
    customTitle: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    customItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      backgroundColor: colors.surfaceElevated,
    },
    customItemText: {
      color: colors.textPrimary,
      fontSize: 13,
      flex: 1,
    },
    removeButton: {
      minHeight: 26,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.expense,
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
    },
    removeText: {
      color: colors.expense,
      fontSize: 11,
      fontWeight: '700',
    },
    secondary: {
      minHeight: 38,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    secondaryText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    primary: {
      minHeight: 38,
      borderRadius: Radius.sm,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    primaryText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    disabled: {
      opacity: 0.75,
    },
  });
}
