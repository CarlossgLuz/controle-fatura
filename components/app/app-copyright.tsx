import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function AppCopyright() {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textMuted }]}>
        © 2026 Carlos Gabriel. Todos os direitos reservados.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 4,
  },
  text: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
});

