
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url';

if (!isConfigured) {
  console.warn('Supabase environment variables missing or default. Authentication and DB features will not work.');
}

// Create a client only if configured, otherwise create a fallback or throw a handled error?
// Better to create a client with dummy values that pass validation if missing, 
// so imports don't fail, but calls will fail gracefully (network error).
// However, empty string causes constructor error.
const validUrl = isConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = isConfigured ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(validUrl, validKey);
