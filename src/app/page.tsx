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

  // Only redirect to dashboard if user is signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleNavigate = (view: string) => {
    if (view === 'login' || view === 'landing') router.push('/sign-in');
    else if (view === 'signup') router.push('/sign-up');
    else router.push(`/${view}`);
  };

  // Show loading spinner only while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If signed in, show loading while redirecting to dashboard
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header currentPage="landing" onNavigate={handleNavigate} />
      <LandingView onNavigate={handleNavigate} />
      <Footer />
    </main>
  );
}
