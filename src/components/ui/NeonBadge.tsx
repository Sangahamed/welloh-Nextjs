import React, { ReactNode } from 'react';

interface NeonBadgeProps {
  children: ReactNode;
  variant?: 'cyan' | 'magenta' | 'violet' | 'green';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
  className?: string;
}

const NeonBadge: React.FC<NeonBadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  pulse = false,
  glow = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const variantClasses = {
    cyan: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50',
    magenta: 'bg-pink-500/20 text-pink-300 border border-pink-500/50',
    violet: 'bg-purple-500/20 text-purple-300 border border-purple-500/50',
    green: 'bg-green-500/20 text-green-300 border border-green-500/50',
  };

  const glowMap = {
    cyan: 'shadow-[0_0_8px_#0ff]',
    magenta: 'shadow-[0_0_8px_#f0f]',
    violet: 'shadow-[0_0_8px_#a855f7]',
    green: 'shadow-[0_0_8px_#0f0]',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${glow ? glowMap[variant] : ''}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default NeonBadge;
