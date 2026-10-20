import { create } from 'zustand';
import type { IAuthUser } from '@clinic/shared-types';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

/**
 * Decode a JWT's `exp` claim. Returns false when the token is unparseable or
 * carries no `exp` (in that case we let the API decide instead of guessing).
 */
function isTokenExpired(token: string): boolean {
  try {
    const part = token.split('.')[1];
    if (!part) return false;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

/**
 * Restore a session from the persisted token + user.
 * A session is only valid when BOTH a token and a parsed user are present, and
 * the token has not expired. There is deliberately no demo/fallback user:
 * unauthenticated visitors must always see the login screen.
 */
function readStoredSession(): { user: IAuthUser | null; token: string | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (!token || !raw) return { user: null, token: null };
    if (isTokenExpired(token)) {
      // Don't restore a dead session: show the login screen immediately rather
      // than rendering the app shell and failing every request.
      clearStoredSession();
      return { user: null, token: null };
    }
    const user = JSON.parse(raw) as IAuthUser;
    if (!user || !user.id) return { user: null, token: null };
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

/** Clear every persisted credential. Used by logout and by the 401 interceptor. */
export function clearStoredSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

interface AuthState {
  user: IAuthUser | null;
  clinic: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IAuthUser, token: string, clinic?: any) => void;
  setClinic: (clinic: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const { user, token } = readStoredSession();
  return {
    user,
    clinic: null,
    token,
    isAuthenticated: !!user && !!token,
    setAuth: (user, token, clinic) => {
      try {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {
        /* ignore */
      }
      set({ user, token, clinic: clinic ?? null, isAuthenticated: true });
    },
    setClinic: (clinic) => set({ clinic }),
    logout: () => {
      clearStoredSession();
      set({ user: null, token: null, clinic: null, isAuthenticated: false });
    },
  };
});
