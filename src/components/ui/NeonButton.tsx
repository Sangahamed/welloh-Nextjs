import React, { ReactNode } from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'cyan' | 'magenta' | 'violet' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}

const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  fullWidth = false,
  icon,
  loading = false,
  className = '',
  disabled,
  ...rest
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

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
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {children}
        </>
      ) : (
        <>
          {icon && <span className="w-5 h-5">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default NeonButton;