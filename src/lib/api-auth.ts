import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface AuthResult {
  userId: string;
  email: string;
}

/**
 * Récupère l'utilisateur authentifié dans une route API.
 * Retourne { userId, email } ou null si non authentifié.
 * 
 * Usage dans une route API :
 *   const auth = await getApiAuth();
 *   if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   const { userId } = auth;
 */
export async function getApiAuth(): Promise<AuthResult | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* ignore in Server Components */ }
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Fallback getSession
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        return {
          userId: sessionData.session.user.id,
          email: sessionData.session.user.email || '',
        };
      }
      return null;
    }

    return { userId: user.id, email: user.email || '' };
  } catch {
    return null;
  }
}

/** Réponse 401 standard */
export const unauthorizedResponse = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });