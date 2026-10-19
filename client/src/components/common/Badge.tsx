import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon,
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-brand-700 border border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    teal: 'bg-teal-50 text-teal-800 border border-teal-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full transition-colors',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
