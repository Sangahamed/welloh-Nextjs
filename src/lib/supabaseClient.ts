import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
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
      // NE PAS utiliser flowType: 'pkce' avec Next.js SSR
      // pkce stocke les tokens dans localStorage → serveur ne peut pas les lire
      // Le flow par défaut utilise les cookies → compatible avec SSR/middleware
      storageKey: 'welloh_session_v1',
    }
  }
);