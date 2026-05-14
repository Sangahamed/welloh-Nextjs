"use client";

import React, {
  createContext, useContext, useState, useEffect,
  ReactNode, useCallback, useRef
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import type { User, UserAccount, HistoryItem, Alert } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

interface AuthContextType {
  currentUser: User | null;
  currentUserAccount: UserAccount | null;
  isLoading: boolean;
  accountRecoveryError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (signupData: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUserAccount: (updates: Partial<UserAccount>) => Promise<void>;
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  addAlert: (alertData: Omit<Alert, 'id'>) => Promise<void>;
  removeAlert: (alertId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountRecoveryError, setAccountRecoveryError] = useState<string | null>(null);
  const retryTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const clearRetries = useCallback(() => {
    retryTimeouts.current.forEach(clearTimeout);
    retryTimeouts.current = [];
  }, []);

  const fetchUserAccount = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setCurrentUser(null);
      setCurrentUserAccount(null);
      setIsLoading(false);
      return;
    }

    try {
      // Récupération directe depuis Supabase (client-side)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Si le profil n'existe pas (base de données réinitialisée), forcer la déconnexion
      if (profileError?.code === 'PGRST116') {
        console.warn('[Auth] Profil introuvable - session orpheline détectée. Déconnexion forcée.');
        await supabase.auth.signOut();
        setCurrentUser(null);
        setCurrentUserAccount(null);
        setAccountRecoveryError(
          "Votre session était invalide (base de données réinitialisée). Veuillez vous reconnecter ou créer un nouveau compte."
        );
        setIsLoading(false);
        return;
      }

      if (profileError) throw profileError;

      if (profile) {
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .single();

        const fullName = profile.full_name || 'Utilisateur';

        const account = {
          id: profile.id,
          email: supabaseUser.email ?? '',
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
                Number(portfolio.cash_balance ?? portfolio.current_balance ?? 100000) -
                Number(portfolio.initial_capital ?? portfolio.initial_balance ?? 100000)
              )
            : '0.00',
          totalTrades: profile.total_trades || 0,
          winRate: String(profile.win_rate || '0.00'),
          analysisHistory: [],
          alerts: [],
          createdAt: profile.created_at || new Date().toISOString(),
          isSuspended: profile.is_suspended || false,
          isVerified: profile.is_verified || false,
          followingCount: profile.following_count || 0,
          followersCount: profile.followers_count || 0,
          cashBalance: String(portfolio?.cash_balance ?? portfolio?.current_balance ?? '100000.00'),
          initialCapital: String(portfolio?.initial_capital ?? portfolio?.initial_balance ?? '100000.00'),
        };

        setCurrentUser({
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          role: account.role,
        });
        setCurrentUserAccount(account);
        setAccountRecoveryError(null);
      } else {
        // Création du profil si absent
        const displayName = supabaseUser.user_metadata?.full_name || 'Trader';
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            full_name: displayName,
            role: 'user',
            league: 'bronze',
            level: 1,
            experience_points: 0,
          });

        if (insertError) throw insertError;

        // Relancer la récupération
        await fetchUserAccount(supabaseUser);
        return;
      }
    } catch (e: any) {
      console.error('[Auth] Erreur chargement compte:', e.message);
      setAccountRecoveryError('Erreur de chargement du profil.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Écouteur d'état d'authentification
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event, '| User:', session?.user?.id ?? 'null');

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (session?.user) {
            clearRetries();
            await fetchUserAccount(session.user);
          } else {
            setIsLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user && !currentUser) {
            await fetchUserAccount(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          clearRetries();
          setCurrentUser(null);
          setCurrentUserAccount(null);
          setAccountRecoveryError(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
      clearRetries();
    };
  }, [fetchUserAccount, clearRetries, currentUser]);

  // Redirection automatique après authentification
  useEffect(() => {
    if (!isLoading && currentUser) {
      const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname === '/';
      if (isAuthPage) {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, currentUser, pathname, router]);

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client non initialisé.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error("L'adresse e-mail ou le mot de passe est incorrect.");
      }
      throw new Error(error.message);
    }
    // La redirection sera gérée par le useEffect ci-dessus après SIGNED_IN
  };

  const signup = async ({ fullName, email, password }: SignUpData) => {
    if (!supabase) throw new Error('Supabase client non initialisé.');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Un utilisateur avec cette adresse e-mail existe déjà.');
      }
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    if (!supabase) throw new Error('Supabase client non initialisé.');
    clearRetries();
    setAccountRecoveryError(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/sign-in');
  };

  const updateCurrentUserAccount = async (updates: Partial<UserAccount>) => {
    if (!currentUserAccount) return;
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      const updatedProfile = await response.json();
      setCurrentUserAccount(prev => prev ? { ...prev, ...updatedProfile } : null);
    } else {
      console.error('Échec mise à jour profil:', await response.text());
    }
  };

  const addHistoryItem = async (_item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    console.warn('addHistoryItem non implémenté');
  };
  const clearHistory = async () => { console.warn('clearHistory non implémenté'); };
  const addAlert = async (_alertData: Omit<Alert, 'id'>) => {
    console.warn('addAlert non implémenté');
  };
  const removeAlert = async (_alertId: string) => {
    console.warn('removeAlert non implémenté');
  };

  return (
    <AuthContext.Provider value={{
      currentUser, currentUserAccount, isLoading, accountRecoveryError,
      login, signup, logout, updateCurrentUserAccount,
      addHistoryItem, clearHistory, addAlert, removeAlert,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return { ...context, isLoaded: !context.isLoading };
};
