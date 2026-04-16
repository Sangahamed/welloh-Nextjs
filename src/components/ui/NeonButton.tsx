import React, { ReactNode } from 'react';

interface NeonButtonProps {
  children: ReactNode;
  variant?: 'cyan' | 'magenta' | 'violet' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
}

const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  onClick,
  fullWidth = false,
  icon,
  className = '',
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95";
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_12px_#0ff] hover:shadow-[0_0_20px_#0ff]',
    magenta: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_12px_#f0f] hover:shadow-[0_0_20px_#f0f]',
    violet: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_12px_#a855f7] hover:shadow-[0_0_20px_#a855f7]',
    outline: 'border border-cyan-500 text-cyan-400 bg-black/40 backdrop-blur-sm hover:bg-cyan-500/10',
    ghost: 'text-cyan-400 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};

export default NeonButton;
