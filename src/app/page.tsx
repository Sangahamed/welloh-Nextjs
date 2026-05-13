"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import LandingView from "@/components/LandingView";
import Footer from "@/components/Footer";

export default function Page() {
  const { isLoaded, currentUser } = useAuth();
  const router = useRouter();
  const isSignedIn = !!currentUser;

  useEffect(() => {
    // Ne rediriger QUE quand isLoaded=true ET currentUser présent
    // Évite une redirection prématurée pendant le chargement initial
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleNavigate = (view: string) => {
    if (view === 'login' || view === 'landing') router.push('/sign-in');
    else if (view === 'signup') router.push('/sign-up');
    else router.push(`/${view}`);
  };

  // Spinner pendant le chargement de l'auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Spinner pendant la redirection vers /dashboard
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Page d'accueil pour utilisateurs non connectés
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header currentPage="landing" onNavigate={handleNavigate} />
      <LandingView onNavigate={handleNavigate} />
      <Footer />
    </main>
  );
}