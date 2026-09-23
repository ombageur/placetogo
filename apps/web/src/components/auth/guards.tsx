'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogoMark } from '@/components/brand/logo';
import { ErrorState } from '@/components/ui/states';
import { hasSeenIntro, routeForStage, signedOutRoute } from '@/lib/auth/routes';
import { useAuth } from './auth-provider';
import { useMountEffect } from '@/hooks/use-mount-effect';

export function FullPageLoading() {
  return (
    <div role="status" aria-live="polite" className="grid min-h-dvh place-items-center">
      <span className="sr-only">Memuat…</span>
      <LogoMark className="h-12 motion-safe:animate-pulse" />
    </div>
  );
}

function ConfigError() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <ErrorState title="Konfigurasi belum lengkap" description="Aplikasi belum dikonfigurasi dengan benar. Hubungi tim pengembang." />
    </main>
  );
}

export type RequireAuthMode = 'signed-in' | 'verified' | 'ready';

/**
 * Pembatas rute privat (UX). Konten anak tidak dirender sebelum sesi terverifikasi di klien,
 * tetapi keamanan sebenarnya ada di Security Rules dan verifikasi token backend.
 *  - 'signed-in': cukup masuk (mis. halaman verifikasi email)
 *  - 'verified': masuk dan email terverifikasi (mis. halaman lengkapi profil)
 *  - 'ready': masuk, terverifikasi, dan profil lengkap (shell aplikasi utama)
 */
export function RequireAuth({ mode, children }: { mode: RequireAuthMode; children: React.ReactNode }) {
  const { status, account, refreshAccount } = useAuth();
  const router = useRouter();
  const stage = account.kind === 'ready' ? account.account.stage : null;
  const [mounted, setMounted] = React.useState(false);
  const [isPreview, setIsPreview] = React.useState(false);

  const blocked =
    stage != null && ((mode === 'verified' && stage === 'verify_email') || (mode === 'ready' && stage !== 'ready'));

  useMountEffect(() => {
    setMounted(true);
    setIsPreview(
      new URLSearchParams(window.location.search).get('preview') === 'true' ||
        window.sessionStorage.getItem('placetogo_dev_preview') === 'true',
    );
  });

  React.useEffect(() => {
    if (!mounted) return;
    if (isPreview && process.env.NODE_ENV !== 'production') return;
    if (status === 'signed-out') router.replace(signedOutRoute(hasSeenIntro()));
    else if (blocked && stage) router.replace(routeForStage(stage));
  }, [mounted, status, blocked, stage, router, isPreview]);

  if (!mounted) return <FullPageLoading />;
  if (isPreview && process.env.NODE_ENV !== 'production') {
    return <>{children}</>;
  }

  if (status === 'config-error') return <ConfigError />;
  if (status !== 'signed-in') return <FullPageLoading />;
  if (account.kind === 'error') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
        <ErrorState
          title="Tidak dapat memuat akun"
          description="Periksa koneksi internet kamu lalu coba lagi."
          onRetry={() => void refreshAccount()}
        />
      </main>
    );
  }
  if (account.kind === 'loading') return <FullPageLoading />;
  if (blocked) return <FullPageLoading />;
  return <>{children}</>;
}

/** Untuk halaman masuk/daftar: pengguna yang sudah masuk dialihkan sesuai tahap akunnya. */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const { status, account } = useAuth();
  const router = useRouter();
  const stage = account.kind === 'ready' ? account.account.stage : null;
  const [mounted, setMounted] = React.useState(false);
  const [isPreview, setIsPreview] = React.useState(false);

  useMountEffect(() => {
    setMounted(true);
    setIsPreview(
      new URLSearchParams(window.location.search).get('preview') === 'true' ||
        window.sessionStorage.getItem('placetogo_dev_preview') === 'true',
    );
  });

  React.useEffect(() => {
    if (!mounted) return;
    if (isPreview && process.env.NODE_ENV !== 'production') return;
    if (stage) router.replace(routeForStage(stage));
  }, [mounted, stage, router, isPreview]);

  if (!mounted) return <FullPageLoading />;
  if (isPreview && process.env.NODE_ENV !== 'production') {
    return <>{children}</>;
  }

  if (status === 'config-error') return <ConfigError />;
  if (status === 'loading') return <FullPageLoading />;
  if (status === 'signed-in') return <FullPageLoading />;
  return <>{children}</>;
}
