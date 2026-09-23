import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Target sentuh minimum 44px (min-h-11) pada semua ukuran. */
export const buttonVariants = cva(
  'inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-secondary',
        secondary: 'bg-mint-strong text-primary hover:brightness-95',
        outline: 'border border-border-strong bg-background text-primary hover:bg-mint',
        ghost: 'text-primary hover:bg-mint',
        destructive: 'bg-danger text-danger-foreground hover:opacity-90',
      },
      size: {
        sm: 'px-4 text-sm',
        md: 'px-5 text-base',
        lg: 'min-h-12 px-6 text-base',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', fullWidth: false },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
