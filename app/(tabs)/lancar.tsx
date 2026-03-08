import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function LancarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, insets.bottom, mode === 'dark');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Lançar</Text>
        <Text style={styles.subtitle}>Registre uma movimentação em poucos toques.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ação rápida</Text>
          <Text style={styles.cardText}>Use o fluxo atual para lançar despesa do cartão principal.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/compra')}>
            <Text style={styles.primaryButtonText}>Novo lançamento</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    primaryButton: {
      marginTop: Spacing.sm,
      minHeight: 48,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: isDarkMode ? '#03111B' : '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
