import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { type AppLanguage, type ThemePreference } from '@/data/local/app-settings';
import { supportedLanguages, useI18n } from '@/hooks/use-i18n';
import { useAppTheme } from '@/hooks/use-app-theme';
import { openTrustedExternalUrl } from '@/utils/external-url';
import { devWarn } from '@/utils/logger';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export function AppQuickSettings() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, themePreference, setThemePreference } = useAppTheme();
  const { language, setLanguagePreference, strings } = useI18n();
  const styles = createStyles(colors);

  const languageOptions: AppLanguage[] = supportedLanguages();

  const onOpenLinkedIn = async () => {
    const opened = await openTrustedExternalUrl('https://www.linkedin.com/in/dev-carlosgabriel/');
    if (opened) {
      setOpen(false);
      return;
    }

    devWarn('[settings] trusted external link blocked or unavailable');
  };

  return (
    <>
      <Pressable style={styles.triggerButton} onPress={() => setOpen(true)} hitSlop={8}>
        <IconSymbol name="gearshape.fill" size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          <View style={[styles.menuCard, { marginTop: insets.top + 12 }]}>
            <View style={styles.block}>
              <Text style={styles.blockLabel}>{strings.appearance.themeLabel}</Text>
              <View style={styles.optionList}>
                {THEME_OPTIONS.map((option) => {
                  const selected = themePreference === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionButton, selected && styles.optionButtonSelected]}
                      onPress={() => void setThemePreference(option)}>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {strings.appearance.themeOptions[option]}
                      </Text>
                      {selected ? <IconSymbol name="checkmark" size={14} color={colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>{strings.appearance.languageLabel}</Text>
              <View style={styles.optionList}>
                {languageOptions.map((option) => {
                  const selected = language === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionButton, selected && styles.optionButtonSelected]}
                      onPress={() => void setLanguagePreference(option)}>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {strings.appearance.languageOptions[option]}
                      </Text>
                      {selected ? <IconSymbol name="checkmark" size={14} color={colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable style={styles.linkedinButton} onPress={onOpenLinkedIn}>
              <IconSymbol name="link.circle.fill" size={15} color={colors.info} />
              <Text style={styles.linkedinText}>{strings.common.linkedIn}</Text>
            </Pressable>

            <Text style={styles.localHint}>{strings.common.localFirstHint}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    triggerButton: {
      width: 34,
      height: 34,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      paddingHorizontal: Spacing.xl,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
    },
    menuCard: {
      width: 274,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: Spacing.md,
      gap: Spacing.sm,
      shadowColor: '#000000',
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 9,
    },
    block: {
      gap: 6,
    },
    blockLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    optionList: {
      gap: 6,
    },
    optionButton: {
      minHeight: 34,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
    },
    optionButtonSelected: {
      borderColor: `${colors.primary}88`,
      backgroundColor: `${colors.primary}14`,
    },
    optionText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    optionTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    linkedinButton: {
      marginTop: 2,
      minHeight: 34,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: Spacing.md,
    },
    linkedinText: {
      color: colors.info,
      fontSize: 12,
      fontWeight: '700',
    },
    localHint: {
      color: colors.textMuted,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 2,
    },
  });
}
