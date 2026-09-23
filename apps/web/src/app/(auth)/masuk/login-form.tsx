'use client';

import * as React from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { fieldErrors, loginSchema } from '@placetogo/shared';
import { Logo } from '@/components/brand/logo';
import { GoogleButton } from '@/components/auth/google-button';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { getFirebase } from '@/lib/firebase';
import { authErrorMessage, errorCodeOf } from '@/lib/auth/errors';

export function LoginForm() {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: data.get('email'), password: data.get('password') });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getFirebase().auth, parsed.data.email, parsed.data.password);
      // PublicOnly mengalihkan sesuai tahap akun setelah status dimuat.
    } catch (err) {
      setFormError(authErrorMessage(errorCodeOf(err), 'login'));
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo withTagline className="h-14" />
        <h1 className="text-foreground">Selamat datang kembali</h1>
        <p className="text-sm text-muted-foreground">Masuk untuk melanjutkan petualangan serumu</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          startAdornment={<FaIcon icon="fa-envelope" className="text-sm" />}
          error={errors.email}
        />
        <PasswordField label="Kata sandi" name="password" autoComplete="current-password" error={errors.password} />
        <div className="flex items-center justify-between -mt-2">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <FaIcon icon="fa-headset" className="text-xs text-primary" />
            <span>Butuh Bantuan?</span>
          </button>
          <Link
            href="/lupa-password"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline"
          >
            Lupa kata sandi?
          </Link>
        </div>
        {formError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-soft-foreground flex items-center gap-2">
            <FaIcon icon="fa-triangle-exclamation" className="text-danger shrink-0" />
            <span>{formError}</span>
          </p>
        )}
        <Button type="submit" fullWidth size="lg" loading={loading} className="gap-2">
          <FaIcon icon="fa-arrow-right-to-bracket" className="text-sm" />
          <span>Masuk</span>
        </Button>
        <GoogleButton onError={setFormError} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{' '}
        <Link href="/daftar" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline">
          <span>Daftar di sini</span>
          <FaIcon icon="fa-arrow-right" className="text-xs" />
        </Link>
      </p>

      {/* Modal Bantuan / Support */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FaIcon icon="fa-headset" className="text-lg" />
                <span>Pusat Bantuan & Support</span>
              </div>
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <FaIcon icon="fa-xmark" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mengalami kendala saat masuk atau butuh bantuan terkait akun placetogo?
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20Placetogo,%20saya%20butuh%20bantuan%20login"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs hover:brightness-95 transition-all"
              >
                <FaIcon icon="fa-brands fa-whatsapp" className="text-base text-emerald-600" />
                <div className="flex flex-col">
                  <span>Chat WhatsApp Support</span>
                  <span className="text-[10px] font-normal opacity-80">Respon cepat setiap hari 09:00 - 21:00</span>
                </div>
              </a>
              <a
                href="mailto:support@placetogo.id?subject=Bantuan%20Akun%20Placetogo"
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/60 border border-border text-foreground font-semibold text-xs hover:bg-muted transition-all"
              >
                <FaIcon icon="fa-envelope" className="text-base text-primary" />
                <div className="flex flex-col">
                  <span>Email: support@placetogo.id</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Untuk keluhan resmi & verifikasi</span>
                </div>
              </a>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSupportOpen(false)} className="mt-1">
              Tutup
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
