import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __RAPPI_SUPABASE__?: SupabaseClient;
  }
}

const getClient = (): SupabaseClient => {
  if (typeof window !== 'undefined' && window.__RAPPI_SUPABASE__) {
    return window.__RAPPI_SUPABASE__;
  }

  const client = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_KEY,
    {
      realtime: {
        params: { eventsPerSecond: 20 },
      },
    },
  );

  if (typeof window !== 'undefined') {
    window.__RAPPI_SUPABASE__ = client;
  }

  return client;
};

const supabase = getClient();

const useSupabase = (): SupabaseClient => supabase;

export default useSupabase;
