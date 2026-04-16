"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import LandingView from "@/components/LandingView";
import Footer from "@/components/Footer";

export default function Page() {
  const { isLoaded, currentUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const isSignedIn = !!currentUser;

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) router.push('/dashboard');
      else router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleNavigate = (view: string) => {
    if (view === 'login' || view === 'landing') router.push('/sign-in');
    else if (view === 'signup') router.push('/sign-up');
    else router.push(`/${view}`);
  };

  // While loading or redirecting, show spinner (do not render landing for unauthenticated users)
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#00F5A0]/30">
      <Header currentPage="landing" onNavigate={handleNavigate} />
      
      {/* Landing Entry with Language Switcher */}
      

      <LandingView onNavigate={handleNavigate} />
      <Footer />
    </main>
  );
}
