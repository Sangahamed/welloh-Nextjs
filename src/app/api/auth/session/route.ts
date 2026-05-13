import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Debug : lister les cookies Supabase présents
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(c =>
      c.name.includes('supabase') || c.name.includes('sb-') || c.name.includes('welloh')
    );
    const hasCookies = supabaseCookies.length > 0;

    if (!hasCookies) {
      // Pas de cookies Supabase → utilisateur non connecté côté serveur
      // Cela arrive si :
      // 1. flowType:'pkce' est activé (tokens dans localStorage, pas cookies)
      // 2. Le middleware n'a pas encore eu le temps d'écrire les cookies
      console.log('[SessionAPI] Aucun cookie Supabase trouvé - session non disponible côté serveur');
      return NextResponse.json({ account: null });
    }

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

    // getUser() vérifie le JWT côté serveur Supabase (sécurisé)
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (
          error.message === 'Auth session missing!' ||
          error.message.includes('session missing') ||
          error.message.includes('invalid JWT') ||
          error.message.includes('token is expired')
        ) {
          return NextResponse.json({ account: null });
        }
        console.error('[SessionAPI] getUser error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      user = data.user;
    } catch (e: any) {
      if (e.message?.includes('Auth session missing')) {
        return NextResponse.json({ account: null });
      }
      throw e;
    }

    // Fallback getSession() si getUser() retourne null
    if (!user) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          user = sessionData.session.user;
        }
      } catch { /* ignore */ }
    }

    if (!user) {
      return NextResponse.json({ account: null });
    }

    const userId = user.id;
    const email = user.email || '';

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

    // Profil absent → créer (trigger peut avoir un délai)
    if (!profile) {
      const full_name =
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        'Trader';

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: full_name,
          role: 'user',
          league: 'bronze',
          level: 1,
          experience_points: 0,
        })
        .select()
        .single();

      if (insertError) {
        // Code 23505 = doublon (le trigger a créé entre temps) → re-fetch
        if (insertError.code === '23505') {
          const { data: existingProfile } = await supabase
            .from('profiles').select('*').eq('id', userId).single();
          profile = existingProfile;
        } else {
          console.error('[SessionAPI] Erreur création profil:', insertError);
          return NextResponse.json(
            { error: 'Impossible de créer le profil: ' + insertError.message },
            { status: 500 }
          );
        }
      } else {
        profile = newProfile;
      }

      // Créer portfolio si absent
      const { data: existingPortfolio } = await supabase
        .from('portfolios').select('id').eq('user_id', userId).single();
      if (!existingPortfolio) {
        await supabase.from('portfolios').insert({
          user_id: userId, name: 'Main Portfolio',
          cash_balance: 100000, initial_capital: 100000,
          initial_balance: 100000, current_balance: 100000,
        });
      }

      // Créer watchlist si absente
      const { data: existingWatchlist } = await supabase
        .from('watchlists').select('id').eq('user_id', userId).single();
      if (!existingWatchlist) {
        await supabase.from('watchlists').insert({ user_id: userId, name: 'default' });
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    const { data: portfolio } = await supabase
      .from('portfolios').select('*').eq('user_id', userId).single();

    const fullName = profile.full_name || 'Utilisateur';

    return NextResponse.json({
      account: {
        id: profile.id,
        email,
        fullName,
        avatarUrl: profile.avatar_url || null,
        bio: profile.bio || null,
        country: profile.country || null,
        institution: profile.institution || null,
        role: profile.role || 'user',
        league: profile.league || 'bronze',
        level: profile.level || 1,
        experiencePoints: profile.experience_points || 0,
        totalProfitLoss: portfolio
          ? String(
              Number(portfolio.cash_balance ?? portfolio.current_balance ?? 100000)
              - Number(portfolio.initial_capital ?? portfolio.initial_balance ?? 100000)
            )
          : '0.00',
        totalTrades: profile.total_trades || 0,
        winRate: String(profile.win_rate || '0.00'),
        analysisHistory: [],
        alerts: [],
        createdAt: profile.created_at || profile.updated_at || new Date().toISOString(),
        isSuspended: profile.is_suspended || false,
        isVerified: profile.is_verified || false,
        followingCount: profile.following_count || 0,
        followersCount: profile.followers_count || 0,
        cashBalance: String(portfolio?.cash_balance ?? portfolio?.current_balance ?? '100000.00'),
        initialCapital: String(portfolio?.initial_capital ?? portfolio?.initial_balance ?? '100000.00'),
      }
    });
  } catch (err: any) {
    console.error('[SessionAPI] Erreur inattendue:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}