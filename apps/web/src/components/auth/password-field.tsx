'use client';

import * as React from 'react';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { TextField, type TextFieldProps } from '@/components/ui/input';

/** Kolom kata sandi dengan tombol tampilkan/sembunyikan (aria-pressed, target 44px). */
export function PasswordField({ startAdornment, ...props }: Omit<TextFieldProps, 'type' | 'endAdornment'>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      startAdornment={startAdornment ?? <FaIcon icon="fa-lock" className="text-sm" />}
      endAdornment={
        <button
          type="button"
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors"
        >
          <FaIcon icon={visible ? 'fa-eye-slash' : 'fa-eye'} className="text-sm" />
        </button>
      }
    />
  );
}
