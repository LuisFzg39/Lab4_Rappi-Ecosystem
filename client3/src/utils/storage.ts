import type { UserWithToken } from '../types';

const STORAGE_KEY = 'auth_delivery';

export const getStoredAuth = (): UserWithToken | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as UserWithToken) : null;
};

export const setStoredAuth = (auth: UserWithToken): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
};

export const removeStoredAuth = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
