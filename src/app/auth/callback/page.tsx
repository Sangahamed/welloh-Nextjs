"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Vérification de votre compte...");

  useEffect(() => {
    let cancelled = false;

    // Créer un client SSR-compatible pour que les cookies soient bien écrits
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleCallback() {
      try {
        // Récupérer les paramètres de l'URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        // Erreur explicite dans l'URL
        if (error) {
          setStatus("error");
          setMessage(errorDescription || "Lien de confirmation invalide ou expiré.");
          return;
        }

        // Flow PKCE : échanger le code contre une session
        // Cette opération ÉCRIT les cookies → le serveur peut lire la session ensuite
        if (code) {
          setMessage("Échange du code de confirmation...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus("error");
            setMessage("Code de confirmation invalide ou déjà utilisé. Veuillez vous reconnecter.");
            return;
          }
        }

        // Vérifier que la session est bien établie
        setMessage("Vérification de la session...");
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // Attendre un peu et réessayer (peut arriver avec le flow implicite)
          await new Promise(r => setTimeout(r, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession?.user) {
            setStatus("error");
            setMessage("Session introuvable après confirmation. Veuillez vous reconnecter.");
            return;
          }
        }

        const userId = session?.user?.id || (await supabase.auth.getSession()).data.session?.user?.id;
        if (!userId || cancelled) return;

        // Attendre que le profil soit créé par le trigger handle_new_user
        // (le trigger s'exécute côté serveur, peut prendre ~500ms à ~2s)
        setMessage("Finalisation de votre compte...");

        let profileReady = false;
        const maxAttempts = 8;
        const delays = [300, 500, 800, 1000, 1500, 2000, 2000, 3000];

        for (let i = 0; i < maxAttempts; i++) {
          if (cancelled) return;

          try {
            const { data } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", userId)
              .single();

            if (data?.id) {
              profileReady = true;
              break;
            }
          } catch {
            // Pas encore créé
          }

          setMessage(`Finalisation... (${i + 1}/${maxAttempts})`);
          await new Promise(r => setTimeout(r, delays[i]));
        }

        if (cancelled) return;

        // Si le profil n'existe toujours pas, forcer sa création via l'API
        if (!profileReady) {
          setMessage("Création du profil...");
          try {
            await fetch("/api/auth/session");
            await new Promise(r => setTimeout(r, 500));
          } catch {
            // L'API va créer le profil au prochain fetch
          }
        }

        setMessage("Redirection vers le tableau de bord...");
        // Petite pause pour s'assurer que les cookies sont bien écrits
        await new Promise(r => setTimeout(r, 200));
        router.replace("/dashboard");

      } catch (err: any) {
        if (!cancelled) {
          console.error("[AuthCallback] Error:", err);
          setStatus("error");
          setMessage("Une erreur inattendue est survenue. Veuillez réessayer.");
        }
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm mx-auto px-4">
        {status === "loading" ? (
          <>
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-semibold text-lg">Connexion en cours</p>
              <p className="text-muted-foreground text-sm">{message}</p>
            </div>
            <p className="text-muted-foreground text-xs">
              Ne fermez pas cette fenêtre...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto">
              <span className="text-destructive text-2xl font-bold">✕</span>
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-semibold text-lg">Erreur de confirmation</p>
              <p className="text-muted-foreground text-sm">{message}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/sign-in")}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push("/sign-up")}
                className="w-full py-2.5 px-4 border border-border text-foreground rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Créer un compte
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}