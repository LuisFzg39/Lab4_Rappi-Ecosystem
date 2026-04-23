import { supabase } from './database';

export const initDb = async (): Promise<void> => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (error) {
    throw new Error('Failed to connect to Supabase: ' + error.message);
  }

  console.log('Connected to Supabase. Users found:', data?.length ?? 0);
};
