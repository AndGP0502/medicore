import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'medicore.access_token';
const REFRESH_KEY = 'medicore.refresh_token';
const SERVER_URL_KEY = 'medicore.server_url';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export async function getStoredServerUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(SERVER_URL_KEY);
}

export async function saveServerUrl(url: string): Promise<void> {
  if (url) {
    await SecureStore.setItemAsync(SERVER_URL_KEY, url);
  } else {
    await SecureStore.deleteItemAsync(SERVER_URL_KEY);
  }
}
