import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCopyright } from '@/components/app';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function ModalScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <Text style={styles.text}>Tela de apoio para navegação e testes de fluxo.</Text>
        <Link href="/" dismissTo style={styles.link}>
          <Text style={styles.linkText}>Voltar para início</Text>
        </Link>
        <View style={styles.footer}>
          <AppCopyright />
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.xl,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '700',
    },
    text: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    link: {
      marginTop: Spacing.sm,
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    linkText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    footer: {
      marginTop: Spacing.md,
    },
  });
}
