"use client";

import SupportTicketsView from "@/components/SupportTicketsView";

export default function SupportPage() {
  return (
    <div className="space-y-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan">Support</h1>
        <p className="text-cyan-200 mt-1">
          Get help and support for your trading account.
        </p>
      </div>
      <SupportTicketsView />
    </div>
  );
}