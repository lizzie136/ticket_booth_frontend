import type { AuthUser } from '../api/types';

export const AUTH_STORAGE_KEY = 'ticketbooth:auth';
const TOKEN_COOKIE_NAME = 'ticketbooth_token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface StoredAuthState {
  token: string;
  user: AuthUser;
}

export const persistAuthSession = (authState: StoredAuthState) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  setTokenCookie(authState.token);
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0`;
};

export const getStoredAuth = (): StoredAuthState | null => {
  const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as StoredAuthState;
  } catch {
    return null;
  }
};

export const getStoredAuthToken = (): string | null => {
  const auth = getStoredAuth();
  if (auth?.token) {
    return auth.token;
  }
  return readTokenFromCookie();
};

const setTokenCookie = (token: string) => {
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const readTokenFromCookie = (): string | null => {
  const cookiePairs = document.cookie.split(';');
  for (const pair of cookiePairs) {
    const [name, value] = pair.trim().split('=');
    if (name === TOKEN_COOKIE_NAME) {
      return decodeURIComponent(value || '');
    }
  }
  return null;
};
