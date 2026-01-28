import { createClient } from '@supabase/supabase-js';

// Supabase client setup
// This can be used for direct Supabase integration
// For this demo, we'll use Prisma for data persistence

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const hasSupabase = !!supabase;
