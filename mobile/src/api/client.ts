import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { TokenResponse } from '@/types/api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredServerUrl,
  saveTokens,
} from './tokens';

export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

let currentBaseUrl = DEFAULT_API_URL;

/** Permite al usuario apuntar la app a otro servidor desde Perfil. */
export function setBaseUrl(url: string): void {
  currentBaseUrl = url.replace(/\/+$/, '') || DEFAULT_API_URL;
}

export function getBaseUrl(): string {
  return currentBaseUrl;
}

/** Restaura la URL de servidor guardada (llamar al arrancar la app). */
export async function hydrateBaseUrl(): Promise<void> {
  const stored = await getStoredServerUrl();
  if (stored) currentBaseUrl = stored;
}

/** Callback que el store de sesion registra para reaccionar a un cierre forzado. */
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(cb: () => void): void {
  onSessionExpired = cb;
}

// eslint-disable-next-line import/no-named-as-default-member -- uso estandar de axios.create
export const api: AxiosInstance = axios.create({ timeout: 20000 });

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  config.baseURL = currentBaseUrl;
  const isAuthFree =
    config.url?.startsWith('/auth/login') || config.url?.startsWith('/auth/refresh');
  if (!isAuthFree) {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh con cola anti-duplicados ─────────────────────────────────────
// Nota: el backend actual no expone POST /auth/refresh; se intenta por
// contrato y, si no existe o falla, se limpia la sesion y se vuelve a Login.
let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return null;
        const { data } = await axios.post<TokenResponse>(
          `${currentBaseUrl}/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: 15000 },
        );
        await saveTokens(data.access_token, data.refresh_token ?? refreshToken);
        return data.access_token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthRoute =
      config?.url?.startsWith('/auth/login') || config?.url?.startsWith('/auth/refresh');

    if (status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;
      const newToken = await tryRefresh();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      }
      await clearTokens();
      onSessionExpired?.();
    }
    return Promise.reject(error);
  },
);
