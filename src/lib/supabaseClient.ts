import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // We can't throw here in Next.js if we want it to build, so we'll just log or handle it gracefully
  console.warn("Missing Supabase environment variables. Check .env.local");
}

export const supabase = createClient(
  supabaseUrl || "", 
  supabaseAnonKey || "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'welloh_session_v1',
      lockOptions: {
        retryInterval: 100,
        retryCount: 30,
      }
    }
  }
);
