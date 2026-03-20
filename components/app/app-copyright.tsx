import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/hooks/use-i18n';
import { useAppTheme } from '@/hooks/use-app-theme';

export function AppCopyright() {
  const { colors } = useAppTheme();
  const { strings } = useI18n();
  const year = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textMuted }]}>{strings.common.copyright(year)}</Text>
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
