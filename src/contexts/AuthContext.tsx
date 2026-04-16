"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
    signup: (signupData: Omit<SignUpData, 'password'> & { password: string }) => Promise<void>;
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

    const fetchUserAccount = useCallback(async (supabaseUser: SupabaseUser | null) => {
        setAccountRecoveryError(null);
        if (!supabaseUser) {
            setCurrentUser(null);
            setCurrentUserAccount(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/session');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            if (data.account) {
                const account = data.account;
                setCurrentUser({
                    id: account.id,
                    email: supabaseUser.email ?? '',
                    fullName: account.fullName,
                    role: account.role,
                });
                setCurrentUserAccount({
                    ...account,
                    email: supabaseUser.email ?? '',
                });
                setAccountRecoveryError(null);
            } else {
                // Aucun compte retourné mais pas d'erreur explicite
                console.error(`Compte introuvable pour ${supabaseUser.id}`);
                setCurrentUser(null);
                setCurrentUserAccount(null);
                setAccountRecoveryError(
                    'Votre session est active mais le profil n’a pas pu être chargé. Contactez le support.'
                );
            }
        } catch (e: any) {
            console.error("Erreur de chargement du compte:", e.message);
            setCurrentUser(null);
            setCurrentUserAccount(null);
            setAccountRecoveryError(
                `Erreur lors du chargement du compte : ${e.message ?? 'erreur inconnue'}.`
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            console.log('[Auth] Event:', event, '| User:', session?.user?.id ?? 'null');

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (session?.user) {
                    await fetchUserAccount(session.user);
                } else {
                    setIsLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setCurrentUserAccount(null);
                setAccountRecoveryError(null);
                setIsLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Optionnel: rafraîchir le compte si nécessaire
                console.log('[Auth] Token refreshed');
                await fetchUserAccount(session.user);
            }
        });

        return () => {
            isMounted = false;
            authListener?.subscription.unsubscribe();
        };
    }, [fetchUserAccount]);

    const login = async (email: string, password: string) => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                throw new Error("L'adresse e-mail ou le mot de passe est incorrect.");
            }
            throw new Error(error.message);
        }
    };

    const signup = async (signupData: SignUpData) => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        const { fullName, email, password } = signupData;
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (signUpError) {
            if (signUpError.message.includes("User already registered")) {
                throw new Error("Un utilisateur avec cette adresse e-mail existe déjà.");
            }
            throw new Error(signUpError.message);
        }
    };

    const logout = async () => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        setAccountRecoveryError(null);
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
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
            console.error('Failed to update profile', await response.text());
        }
    };

    // Fonctions vides pour l'instant (à implémenter plus tard)
    const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        console.warn('addHistoryItem not implemented');
    };

    const clearHistory = async () => {
        console.warn('clearHistory not implemented');
    };

    const addAlert = async (alertData: Omit<Alert, 'id'>) => {
        console.warn('addAlert not implemented');
    };

    const removeAlert = async (alertId: string) => {
        console.warn('removeAlert not implemented');
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            currentUserAccount,
            isLoading,
            accountRecoveryError,
            login,
            signup,
            logout,
            updateCurrentUserAccount,
            addHistoryItem,
            clearHistory,
            addAlert,
            removeAlert,
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
    return context;
};