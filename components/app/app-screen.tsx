import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCopyright } from '@/components/app/app-copyright';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface AppScreenProps {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  contentStyle?: ViewStyle;
}

export function AppScreen({
  children,
  footer,
  scroll = true,
  keyboardAware = false,
  contentStyle,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const containerStyle = [
    styles.content,
    {
      paddingBottom: insets.bottom + (footer ? 96 : Spacing.xxl),
      paddingTop: Spacing.sm,
    },
    contentStyle,
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardAware && Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + Spacing.sm}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={containerStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {children}
            <AppCopyright />
          </ScrollView>
        ) : (
          <View style={containerStyle}>
            {children}
            <AppCopyright />
          </View>
        )}

        {footer ? (
          <View
            style={[
              styles.footer,
              {
                left: Spacing.xl,
                right: Spacing.xl,
                bottom: Math.max(insets.bottom, Spacing.md),
              },
            ]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 14,
  },
  footer: {
    position: 'absolute',
  },
});
