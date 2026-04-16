import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
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

    // Récupérer l'utilisateur auth et son email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('[SessionAPI] Erreur getUser:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    const email = user?.email || '';

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

    // Si pas de profil, le créer (le trigger devrait l'avoir fait, mais au cas où)
    if (!profile) {
      console.log(`[SessionAPI] Aucun profil pour ${userId}, création...`);
      
      const fullName = user?.user_metadata?.full_name || 'Utilisateur Welloh';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          role: 'user'
        })
        .select()
        .single();

      if (insertError) {
        console.error('[SessionAPI] Erreur création profil:', insertError);
        return NextResponse.json({ error: 'Impossible de créer le profil: ' + insertError.message }, { status: 500 });
      }
      
      profile = newProfile;
      
      // Créer aussi le portfolio s'il n'existe pas
      const { data: existingPortfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!existingPortfolio) {
        const { error: portfolioError } = await supabase
          .from('portfolios')
          .insert({
            user_id: userId,
            cash_balance: 100000,
            initial_capital: 100000
          });
        
        if (portfolioError) {
          console.error('[SessionAPI] Erreur création portfolio:', portfolioError);
          // Ne pas bloquer la connexion si le portfolio échoue
        }
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    // Récupérer le portfolio pour avoir les données financières
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Construire l'objet UserAccount avec les colonnes réelles de la base de données
    // Base de données actuelle: id, updated_at, full_name, role, is_suspended, is_verified, following_count, followers_count
    const userAccount = {
      id: profile.id,
      email,
      fullName: profile.full_name || 'Utilisateur',
      avatarUrl: null, // Pas dans le schéma actuel
      bio: null, // Pas dans le schéma actuel
      country: null, // Pas dans le schéma actuel
      institution: null, // Pas dans le schéma actuel
      role: profile.role || 'user',
      league: 'bronze', // Valeur par défaut
      level: 1, // Valeur par défaut
      experiencePoints: 0, // Valeur par défaut
      totalProfitLoss: portfolio ? String(Number(portfolio.cash_balance) - Number(portfolio.initial_capital)) : '0.00',
      totalTrades: 0, // Valeur par défaut
      winRate: '0.00', // Valeur par défaut
      analysisHistory: [],
      alerts: [],
      createdAt: profile.updated_at || new Date().toISOString(),
      // Champs supplémentaires de la base de données réelle
      isSuspended: profile.is_suspended || false,
      isVerified: profile.is_verified || false,
      followingCount: profile.following_count || 0,
      followersCount: profile.followers_count || 0,
      // Données portfolio
      cashBalance: portfolio?.cash_balance || '100000.00',
      initialCapital: portfolio?.initial_capital || '100000.00',
    };

    return NextResponse.json({ account: userAccount });
  } catch (err: any) {
    console.error('Erreur route session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
