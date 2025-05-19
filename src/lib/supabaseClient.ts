import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Supabase URL is not defined. Please set NEXT_PUBLIC_SUPABASE_URL in your .env.local file.");
  // Potentially throw an error or return a mock client for environments where it's not critical (like static site generation parts if any)
  // For now, we let it proceed, but operations will fail.
}
if (!supabaseAnonKey) {
  console.error("Supabase anon key is not defined. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.");
}

// Ensure the client is only created once.
// The null assertion `!` is used because we check and log errors above.
// In a real app, you might handle the undefined case more gracefully,
// perhaps by providing a mock client or throwing an error to halt execution.
export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);

// Helper to get the current user's profile data from Supabase
export async function getSupabaseUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile from Supabase:', error.message);
    return null;
  }
  return data as UserProfile | null;
}

// You'll need to import UserProfile type
import type { UserProfile } from '@/types';
