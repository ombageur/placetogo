'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FaIcon } from '@/components/ui/font-awesome-icon';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Segmented Control (Pill toggle) sesuai referensi Screen 14 (List | Peta).
 */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-muted/60 p-1 shadow-inner',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full transition-all text-xs font-semibold',
              size === 'sm' ? 'px-3 py-1 min-h-8' : 'px-4 py-1.5 min-h-9',
              isSelected
                ? 'bg-background text-primary font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.icon && (
              <FaIcon
                icon={option.icon}
                className={cn('text-xs', isSelected ? 'text-primary' : 'text-muted-foreground')}
              />
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
