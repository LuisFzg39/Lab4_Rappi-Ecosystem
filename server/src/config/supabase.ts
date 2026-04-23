import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './index';

export const supabaseRealtime = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
