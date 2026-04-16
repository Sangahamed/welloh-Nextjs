import React from 'react';
import AnimatedBackground from './ui/AnimatedBackground';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-neon-violet/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="text-3xl font-black italic tracking-tighter">
            <span className="text-white">WELL</span>
            <span className="text-neon-cyan drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">OH</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-dark-800/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
          {/* Subtle Border Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <h1 className="text-2xl font-bold text-white mb-8 text-center">
            {title}
          </h1>

          {children}
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-gray-500 text-sm">
          Propulsé par <span className="text-neon-cyan font-semibold">Gemini AI</span> & <span className="text-neon-violet font-semibold">Supabase</span>
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
