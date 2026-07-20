import { create } from 'zustand';
import { api, setOnSessionExpired } from '@/api/client';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '@/api/tokens';
import type { TokenResponse, User } from '@/types/api';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,

  hydrate: async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ status: 'signedOut', user: null });
        return;
      }
      const { data } = await api.get<User>('/auth/me');
      set({ status: 'signedIn', user: data });
    } catch {
      // Token invalido o backend inaccesible: el interceptor ya limpio si aplicaba.
      set({ status: 'signedOut', user: null });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password });
    await saveTokens(data.access_token, data.refresh_token);
    const me = await api.get<User>('/auth/me');
    set({ status: 'signedIn', user: me.data });
  },

  logout: async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // El logout local procede aunque el servidor no responda.
    }
    await clearTokens();
    set({ status: 'signedOut', user: null });
  },

  setUser: (user) => set({ user }),
}));

// Si el refresh falla tras un 401, el cliente HTTP fuerza el cierre de sesion.
setOnSessionExpired(() => {
  const { status } = useAuthStore.getState();
  if (status === 'signedIn') {
    useAuthStore.setState({ status: 'signedOut', user: null });
  }
});
