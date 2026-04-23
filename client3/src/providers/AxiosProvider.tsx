import axios from 'axios';
import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { AxiosInstance } from 'axios';
import { getStoredAuth } from '../utils/storage';

const AxiosContext = createContext<AxiosInstance | null>(null);

export function AxiosProvider({ children }: { children: ComponentChildren }) {
  const instance = useMemo(() => {
    const inst = axios.create();

    inst.interceptors.request.use((config) => {
      const token = getStoredAuth()?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    inst.interceptors.response.use(
      (response) => response,
      (error) => {
        const message: string =
          error.response?.data?.message ?? 'An unexpected error occurred';
        return Promise.reject(new Error(message));
      }
    );

    return inst;
  }, []);

  return (
    <AxiosContext.Provider value={instance}>
      {children}
    </AxiosContext.Provider>
  );
}

export function useAxios() {
  const ctx = useContext(AxiosContext);
  if (!ctx) throw new Error('useAxios must be used within AxiosProvider');
  return ctx;
}
