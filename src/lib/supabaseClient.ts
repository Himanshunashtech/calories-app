
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  const errorMessage = "Supabase URL is not defined. Please set NEXT_PUBLIC_SUPABASE_URL as an environment variable in your hosting provider (e.g., Netlify, Vercel) or in your .env.local file for local development.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}
if (!supabaseAnonKey) {
  const errorMessage = "Supabase anon key is not defined. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY as an environment variable in your hosting provider (e.g., Netlify, Vercel) or in your .env.local file for local development.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get the current user's profile data from Supabase
export async function getSupabaseUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // Log less critical errors without throwing, to allow app to potentially function if profile fetch fails but auth is ok.
    if (error.code !== 'PGRST116') { // PGRST116: No rows found, which is valid for new users.
        console.error('Error fetching user profile from Supabase:', error.message);
    }
    return null;
  }
  return data as UserProfile | null;
}
