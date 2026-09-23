'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { ActivityDoc } from '@placetogo/shared';
import { ActivityRow } from '@/components/activities/activity-row';
import { ActivityCardSkeletonList } from '@/components/activities/activity-card-skeleton';
import { useAuth } from '@/components/auth/auth-provider';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { fetchDiscoveryPage } from '@/lib/activities/read';
import { useViewerPosition } from '@/hooks/use-viewer-position';
import { getMyProfile, getWallet } from '@/lib/api';
import { HomeBannerCarousel } from '@/components/home/home-banner-carousel';

const PREVIEW_SIZE = 4;

type PreviewState = { kind: 'loading' } | { kind: 'ready'; items: ActivityDoc[] } | { kind: 'error' };

async function loadPreview(): Promise<PreviewState> {
  try {
    const page = await fetchDiscoveryPage({}, null, PREVIEW_SIZE);
    return { kind: 'ready', items: page.items };
  } catch {
    return { kind: 'error' };
  }
}

export function BerandaView() {
  const { account } = useAuth();
  const viewerPosition = useViewerPosition();
  const [state, setState] = React.useState<PreviewState>({ kind: 'loading' });
  const [coinBalance, setCoinBalance] = React.useState<number | null>(null);
  const [displayName, setDisplayName] = React.useState<string>('Sahabat');

  React.useEffect(() => {
    let ignore = false;
    void loadPreview().then((result) => {
      if (!ignore) setState(result);
    });

    if (account.kind === 'ready') {
      void getMyProfile()
        .then((profile) => {
          if (!ignore && profile) setDisplayName(profile.displayName);
        })
        .catch(() => {});
      void getWallet()
        .then((res) => {
          if (!ignore) setCoinBalance(res.balance);
        })
        .catch(() => {
          // ignore
        });
    }

    return () => {
      ignore = true;
    };
  }, [account]);

  return (
    <div className="flex flex-col gap-5">
      {/* Saldo & Quick Profile Pill */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-secondary" />
            Selamat datang kembali
          </p>
          <h1 className="text-foreground">Halo, {displayName}! 👋</h1>
        </div>

        <Link
          href="/dompet"
          className="flex min-h-11 items-center gap-2 rounded-2xl border border-coin/30 bg-warning-soft px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-coin/20 hover:scale-[1.02] shadow-2xs"
        >
          <div className="flex size-6 items-center justify-center rounded-full bg-coin text-white">
            <FaIcon icon="fa-coins" className="text-[11px]" />
          </div>
          <span>{coinBalance != null ? coinBalance.toLocaleString('id-ID') : '10.000'} Coin</span>
        </Link>
      </div>

      {/* 3-Slide Banner Carousel */}
      <HomeBannerCarousel />

      {/* Screen 12: KARTU AKTIVITAS KAMU (Aktif) */}
      <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-4 shadow-sm relative overflow-hidden transition-all hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-0.5 text-xs font-bold text-primary">
            <FaIcon icon="fa-clock" className="text-[10px]" />
            Aktivitas Kamu
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold">
              <FaIcon icon="fa-cake-candles" className="text-[10px]" />
              Ditraktir
            </span>
            <span className="text-xs font-semibold text-secondary flex items-center gap-1">
              <FaIcon icon="fa-bell" className="text-[10px]" />
              Mendatang
            </span>
          </div>
        </div>

        <div className="pt-1">
          <h2 className="text-lg font-bold text-foreground">Ngopi santai di Tuku</h2>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <FaIcon icon="fa-calendar-day" className="text-primary text-xs" />
              Hari ini • 18:00
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FaIcon icon="fa-location-dot" className="text-primary text-xs" />
              Tuku Menteng • 2,4 km
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/jelajah"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-xs"
          >
            <span>Lihat Detail</span>
            <FaIcon icon="fa-arrow-right" className="text-[11px]" />
          </Link>
        </div>
      </div>

      {/* Screen 12: Rekomendasi Untukmu */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Rekomendasi untukmu</h2>
            <p className="text-xs text-muted-foreground">Ajakan seru terpopuler di sekitarmu</p>
          </div>
          <Link
            href="/jelajah"
            className="inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary hover:bg-mint transition-colors"
          >
            <span>Lihat semua</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {state.kind === 'loading' && <ActivityCardSkeletonList count={PREVIEW_SIZE} />}
        {state.kind === 'error' && (
          <ErrorState
            description="Tidak dapat memuat rekomendasi."
            onRetry={() => {
              setState({ kind: 'loading' });
              void loadPreview().then(setState);
            }}
          />
        )}
        {state.kind === 'ready' && state.items.length === 0 && (
          <EmptyState
            icon={<FaIcon icon="fa-calendar-xmark" className="text-xl" />}
            title="Belum ada ajakan"
            description="Belum ada ajakan aktif di sekitarmu. Coba buat ajakan pertamamu."
          />
        )}
        {state.kind === 'ready' && state.items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {state.items.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} viewerPosition={viewerPosition} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
