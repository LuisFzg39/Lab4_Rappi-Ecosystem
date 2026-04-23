import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
