'use client';

import * as React from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { fieldErrors, resetRequestSchema } from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { getFirebase } from '@/lib/firebase';
import { authErrorMessage, errorCodeOf } from '@/lib/auth/errors';
import { useCooldown } from '@/hooks/use-cooldown';

const COOLDOWN_SECONDS = 60;

export function ResetForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [fieldError, setFieldError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [remaining, startCooldown] = useCooldown(COOLDOWN_SECONDS);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = resetRequestSchema.safeParse({ email: new FormData(e.currentTarget).get('email') });
    if (!parsed.success) {
      setFieldError(fieldErrors(parsed.error.issues).email);
      return;
    }
    setFieldError(undefined);
    setLoading(true);
    try {
      await sendPasswordResetEmail(getFirebase().auth, parsed.data.email);
    } catch (err) {
      // Email tidak terdaftar diperlakukan sama seperti sukses agar akun tidak dapat ditebak.
      if (errorCodeOf(err) !== 'auth/user-not-found') {
        setError(authErrorMessage(errorCodeOf(err), 'reset'));
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setSent(true);
    startCooldown();
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-foreground">Lupa kata sandi</h1>
        <p className="text-sm text-muted-foreground">Masukkan email akunmu. Kami akan mengirim tautan untuk mengatur ulang kata sandi.</p>
      </div>

      {sent && (
        <div role="status" className="flex items-start gap-3 rounded-2xl bg-mint p-4 text-primary border border-mint-strong">
          <FaIcon icon="fa-circle-check" className="mt-0.5 text-base shrink-0" />
          <p className="text-sm font-medium">
            Jika email tersebut terdaftar, tautan pengaturan ulang kata sandi sudah dikirim. Periksa kotak masuk dan folder spam.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          startAdornment={<FaIcon icon="fa-envelope" className="text-sm" />}
          error={fieldError}
        />
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-soft-foreground flex items-center gap-2">
            <FaIcon icon="fa-triangle-exclamation" className="text-danger shrink-0" />
            <span>{error}</span>
          </p>
        )}
        <Button type="submit" fullWidth size="lg" loading={loading} disabled={remaining > 0} className="gap-2">
          <FaIcon icon="fa-paper-plane" className="text-sm" />
          <span>{remaining > 0 ? `Kirim ulang dalam ${remaining} dtk` : sent ? 'Kirim ulang tautan' : 'Kirim tautan'}</span>
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link href="/masuk" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline">
          <FaIcon icon="fa-arrow-left" className="text-xs" />
          <span>Kembali ke Masuk</span>
        </Link>
      </p>
    </>
  );
}
