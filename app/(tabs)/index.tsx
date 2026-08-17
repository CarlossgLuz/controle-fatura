import { Redirect } from 'expo-router';

export default function HiddenIndexScreen() {
  return <Redirect href="/(tabs)/resumo" />;
}
