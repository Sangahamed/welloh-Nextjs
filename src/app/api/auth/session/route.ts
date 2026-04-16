import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { ensureUserProfileAndPortfolio } from '@/lib/database';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ account: null });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            try { cookieStore.set({ name, value, ...options }); } catch (error) {}
          },
          remove(name: string, options: CookieOptions) {
            try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
          },
        },
      }
    );

    // Récupérer le profil
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[SessionAPI] Erreur profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Si pas de profil, tenter la réparation
    if (!profile) {
      console.log(`[SessionAPI] Aucun profil pour ${userId}, réparation...`);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[SessionAPI] Erreur getUser:', userError);
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }
      if (user) {
        const repaired = await ensureUserProfileAndPortfolio(user);
        if (repaired) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          profile = newProfile;
        }
      }
      if (!profile) {
        return NextResponse.json({ error: 'Profil introuvable après réparation' }, { status: 404 });
      }
    }

    // Récupérer l'email
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email || '';

    // Construire l'objet UserAccount avec les colonnes exactes
    const userAccount = {
      id: profile.id,
      email,
      fullName: profile.full_name || 'Utilisateur',
      avatarUrl: profile.avatar_url || null,
      bio: profile.bio || null,
      country: profile.country || null,
      institution: profile.institution || null,
      role: profile.role || 'user',
      league: profile.league || 'bronze',
      level: profile.level || 1,
      experiencePoints: profile.experience_points || 0,
      totalProfitLoss: profile.total_profit_loss || '0.00',
      totalTrades: profile.total_trades || 0,
      winRate: profile.win_rate || '0.00',
      analysisHistory: [],      // à implémenter si besoin
      alerts: [],               // à implémenter si besoin
      createdAt: profile.created_at,
    };

    return NextResponse.json({ account: userAccount });
  } catch (err: any) {
    console.error('Erreur route session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}