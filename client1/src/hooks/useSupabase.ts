import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
);

const useSupabase = (): SupabaseClient => supabase;

export default useSupabase;
