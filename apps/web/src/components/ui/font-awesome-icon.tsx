'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FontAwesomeIconProps extends React.HTMLAttributes<HTMLElement> {
  /** Nama icon Font Awesome (contoh: 'fa-solid fa-mug-hot' atau 'fa-coins' jika prefix disertakan) */
  icon: string;
  /** Ukuran standar atau custom */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Animasi berputar */
  spin?: boolean;
}

const SIZE_MAP = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

/**
 * Komponen pembungkus Font Awesome 6 Icon.
 * Mendukung icon 'fa-solid fa-...', 'fa-regular fa-...', 'fa-brands fa-...'.
 */
export function FaIcon({ icon, size, spin, className, ...props }: FontAwesomeIconProps) {
  const trimmed = icon.trim();
  const hasStylePrefix = /\b(fa-solid|fa-regular|fa-brands|fa-light|fa-thin|fa-duotone|fas|far|fab)\b/.test(trimmed);
  let iconClasses = trimmed;

  if (!hasStylePrefix) {
    // Jika hanya diberi 'fa-mug-hot' atau 'mug-hot', wajib tambahkan style class 'fa-solid'
    const iconName = trimmed.startsWith('fa-') ? trimmed : `fa-${trimmed}`;
    iconClasses = `fa-solid ${iconName}`;
  }
  return (
    <i
      aria-hidden="true"
      className={cn(
        iconClasses,
        size && SIZE_MAP[size],
        spin && 'fa-spin',
        'inline-flex items-center justify-center shrink-0',
        className,
      )}
      {...props}
    />
  );
}
