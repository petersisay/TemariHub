import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; icon: string; text: string }> = {
  xs: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm' },
  lg: { container: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-base' },
  xl: { container: 'w-20 h-20', icon: 'w-9 h-9', text: 'text-xl' },
  '2xl': { container: 'w-28 h-28', icon: 'w-12 h-12', text: 'text-2xl' },
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const { container, icon, text } = sizeClasses[size];

  if (src && !hasError) {
    return (
      <img
        key={src}
        src={src}
        alt={alt || name}
        onError={() => setHasError(true)}
        className={`${container} rounded-full object-cover border border-slate-200/80 shadow-2xs ${className}`}
      />
    );
  }

  return (
    <div
      className={`${container} rounded-full bg-gradient-to-br from-brand-500 to-navy-700 text-white font-bold flex items-center justify-center shrink-0 border border-slate-200/80 select-none shadow-2xs ${text} ${className}`}
      title={name}
      aria-label={alt || name}
    >
      {initials ? initials : <UserIcon className={icon} />}
    </div>
  );
};
