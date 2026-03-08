import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setOnboardingDone } from '@/data/local/app-settings';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, mode === 'dark');

  const onContinue = async () => {
    await setOnboardingDone();
    router.replace('/(tabs)/inicio');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo</Text>
        <Text style={styles.subtitle}>
          App financeiro simples: 1 cartão, receitas, gastos fixos e meta mensal, tudo local.
        </Text>

        <View style={styles.listCard}>
          <Text style={styles.item}>• 1 cartão principal</Text>
          <Text style={styles.item}>• Sem saldo de conta</Text>
          <Text style={styles.item}>• Lançamentos avulsos e recorrentes</Text>
          <Text style={styles.item}>• Meta mensal para controle</Text>
        </View>

        <Pressable style={styles.button} onPress={onContinue}>
          <Text style={styles.buttonText}>Começar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDarkMode: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.lg,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    },
    listCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    item: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    button: {
      minHeight: 52,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    buttonText: {
      color: isDarkMode ? '#03111B' : '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
