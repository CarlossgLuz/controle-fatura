import AsyncStorage from 'expo-sqlite/kv-store';

const ONBOARDING_KEY = 'finance.onboarding.completed.v1';

export async function isOnboardingDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === '1';
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}
