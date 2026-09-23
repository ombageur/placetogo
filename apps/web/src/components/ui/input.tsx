import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-xl border border-border-strong bg-background px-4 text-base text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-danger disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export interface TextFieldProps extends Omit<React.ComponentProps<'input'>, 'id'> {
  /** Label wajib agar setiap kontrol dapat diakses pembaca layar. */
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  /** Elemen di ujung kiri kolom (mis. ikon input). */
  startAdornment?: React.ReactNode;
  /** Elemen di ujung kanan kolom (mis. tombol tampilkan kata sandi). */
  endAdornment?: React.ReactNode;
}

/** Input berlabel: menghubungkan label, petunjuk, dan pesan galat lewat ARIA. */
export function TextField({ label, hint, error, id, className, startAdornment, endAdornment, ...props }: TextFieldProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative flex items-center">
        {startAdornment && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            {startAdornment}
          </div>
        )}
        <Input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            startAdornment && 'pl-10',
            endAdornment && 'pr-12',
          )}
          {...props}
        />
        {endAdornment && <div className="absolute inset-y-0 right-0 flex items-center">{endAdornment}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
