"use client";

import React from 'react';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  success?: boolean;
}

const NeonInput: React.FC<NeonInputProps> = ({
  label,
  icon,
  iconPosition = 'left',
  success,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-400 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-cyan transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-dark-800/50 border border-white/10 rounded-xl
            py-3 px-4 transition-all duration-300
            placeholder:text-gray-600 text-white
            focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20
            hover:border-white/20
            ${icon && iconPosition === 'left' ? 'pl-12' : ''}
            ${icon && iconPosition === 'right' ? 'pr-12' : ''}
            ${success ? 'border-neon-green/50 focus:border-neon-green/50 focus:ring-neon-green/20' : ''}
            ${className}
          `}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-cyan transition-colors">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default NeonInput;
