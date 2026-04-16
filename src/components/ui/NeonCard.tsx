import React, { ReactNode } from 'react';

interface NeonCardProps {
  children: ReactNode;
  variant?: 'default' | 'gradient' | 'cyan' | 'magenta' | 'violet';
  className?: string;
}

const NeonCard: React.FC<NeonCardProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'border border-white/10 bg-black/40 backdrop-blur-sm',
    gradient: 'border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent',
    cyan: 'border border-cyan-500/30 bg-black/40 shadow-[0_0_15px_rgba(0,255,255,0.1)]',
    magenta: 'border border-pink-500/30 bg-black/40 shadow-[0_0_15px_rgba(255,0,255,0.1)]',
    violet: 'border border-purple-500/30 bg-black/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
  };

  return (
    <div className={`rounded-2xl backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default NeonCard;
