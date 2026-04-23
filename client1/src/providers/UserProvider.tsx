import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { UserWithToken } from '../types';
import { getStoredAuth, setStoredAuth, removeStoredAuth } from '../utils/storage';

interface UserContextType {
  auth: UserWithToken | null;
  setAuth: (auth: UserWithToken | null) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ComponentChildren }) {
  const [auth, setAuthState] = useState<UserWithToken | null>(getStoredAuth);

  const setAuth = (value: UserWithToken | null) => {
    if (value) {
      setStoredAuth(value);
    } else {
      removeStoredAuth();
    }
    setAuthState(value);
  };

  return (
    <UserContext.Provider value={{ auth, setAuth }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
