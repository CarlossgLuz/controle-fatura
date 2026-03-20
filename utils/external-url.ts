import { Linking } from 'react-native';

const TRUSTED_HOSTS = new Set(['linkedin.com', 'www.linkedin.com']);

export async function openTrustedExternalUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const isSecure = parsed.protocol === 'https:';
    const trustedHost = TRUSTED_HOSTS.has(parsed.hostname.toLowerCase());

    if (!isSecure || !trustedHost) {
      return false;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
