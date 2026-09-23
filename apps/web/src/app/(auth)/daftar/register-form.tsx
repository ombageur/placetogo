'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { fieldErrors, registerSchema } from '@placetogo/shared';
import { Logo } from '@/components/brand/logo';
import { GoogleButton } from '@/components/auth/google-button';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { getFirebase } from '@/lib/firebase';
import { authErrorMessage, errorCodeOf } from '@/lib/auth/errors';

/**
 * Screen 6: Pendaftaran Akun Baru (Buat akun placetogo.id)
 */
export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    
    const parsed = registerSchema.safeParse({
      fullName: data.get('fullName'),
      email: data.get('email'),
      phoneNumber: data.get('phoneNumber'),
      password: data.get('password'),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { auth } = getFirebase();
      const cred = await createUserWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      
      // Simpan nama lengkap ke Firebase Auth Profile
      if (parsed.data.fullName) {
        await updateProfile(cred.user, { displayName: parsed.data.fullName }).catch(() => {});
      }

      // Simpan nomor HP sementara untuk verifikasi OTP Screen 7
      if (parsed.data.phoneNumber) {
        sessionStorage.setItem('placetogo_reg_phone', parsed.data.phoneNumber);
      }

      // Arahkan ke Screen 7 (Verifikasi OTP)
      router.push(`/verifikasi-otp?phone=${encodeURIComponent(parsed.data.phoneNumber || '+6281234567890')}`);
    } catch (err) {
      setFormError(authErrorMessage(errorCodeOf(err), 'register'));
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo withTagline className="h-14" />
        <h1 className="text-foreground">Buat akun placetogo.id</h1>
        <p className="text-xs text-muted-foreground">Temukan teman, temukan tempat.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
        <TextField
          label="Nama lengkap"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkap kamu"
          startAdornment={<FaIcon icon="fa-user" className="text-sm" />}
          error={errors.fullName}
        />

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

        <TextField
          label="Nomor HP"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="081234567890"
          startAdornment={<FaIcon icon="fa-phone" className="text-sm" />}
          error={errors.phoneNumber}
        />

        <PasswordField
          label="Kata sandi"
          name="password"
          autoComplete="new-password"
          hint="Minimal 8 karakter, kombinasi huruf dan angka."
          error={errors.password}
        />

        {formError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-xs font-medium text-danger-soft-foreground flex items-center gap-2">
            <FaIcon icon="fa-triangle-exclamation" className="text-danger shrink-0" />
            <span>{formError}</span>
          </p>
        )}

        <Button type="submit" fullWidth size="lg" loading={loading} className="gap-2 mt-1">
          <FaIcon icon="fa-user-plus" className="text-sm" />
          <span>Daftar</span>
        </Button>

        <GoogleButton onError={setFormError} />
      </form>

      <p className="text-center text-xs text-muted-foreground pt-1">
        Dengan mendaftar, kamu menyetujui Syarat & Ketentuan dan Kebijakan Privasi placetogo.id.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href="/masuk" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline">
          <span>Masuk</span>
          <FaIcon icon="fa-arrow-right" className="text-xs" />
        </Link>
      </p>
    </>
  );
}
