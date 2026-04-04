import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, Globe, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground dark">
      <nav className="border-b border-border p-4 flex justify-between items-center bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <TrendingUp className="w-6 h-6" />
          <span>Welloh</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground font-medium text-sm">Sign In</Link>
          <Link href="/sign-up">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main>
        <section className="py-32 px-4 text-center max-w-4xl mx-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-6 border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Global Markets Live
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            The professional trading terminal for everyone.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
            Simulate global stock markets, analyze data with AI, and compete on the leaderboard. Master trading without the risk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8">Open Trading Account</Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">Learn More</Button>
            </Link>
          </div>
        </section>

        <section className="py-24 bg-card border-y border-border">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Global Access</h3>
              <p className="text-muted-foreground">Trade across NYSE, NASDAQ, BRVM, and JSE all from a single terminal.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Intelligence</h3>
              <p className="text-muted-foreground">Utilize our advanced AI mentor to analyze stocks and compare market trends in real-time.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Zero Risk</h3>
              <p className="text-muted-foreground">Practice strategies with simulated capital. Climb the leaderboard by maximizing your Sharpe ratio.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-4 text-center text-muted-foreground border-t border-border mt-24">
        <p>&copy; {new Date().getFullYear()} Welloh. All rights reserved. Simulated trading platform.</p>
      </footer>
    </div>
  );
}
