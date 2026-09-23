'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, MapPin, MapPinOff, Coins, Wallet, ChevronRight, Plus } from 'lucide-react';
import { CITY_CATALOG, INTEREST_CATALOG, type InterestId, type MyProfile, type ProfileStats, type WalletSummary } from '@placetogo/shared';
import { Avatar } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/states';
import { SkeletonList } from '@/components/ui/skeleton';
import { getMyProfile, getProfileStats, getWallet } from '@/lib/api';
import { TopupModal } from '@/components/wallet/topup-modal';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { INTEREST_IMAGE_SRC } from '@/components/profile/interest-images';
import { useAuth } from '@/components/auth/auth-provider';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

const cityLabel = (id: string) => CITY_CATALOG.find((c) => c.id === id)?.label ?? id;
const interestLabel = (id: string) => INTEREST_CATALOG.find((i) => i.id === id)?.label ?? id;

const DEFAULT_PROFILE: MyProfile = {
  displayName: 'Teman PlaceToGo',
  avatarId: 'cat',
  bio: 'Temukan teman dan tempat seru di sekitarmu.',
  cityId: 'jakarta',
  cityVisible: true,
  interests: ['ngobrol', 'kuliner', 'olahraga'],
};

type LoadState = { kind: 'loading' } | { kind: 'ready'; profile: MyProfile } | { kind: 'error' };

export function ProfileView() {
  const { user } = useAuth();
  const [state, setState] = React.useState<LoadState>({ kind: 'loading' });
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);
  const [openTopupModal, setOpenTopupModal] = React.useState(false);
  const [stats, setStats] = React.useState<ProfileStats | null>(null);

  const fetchWallet = React.useCallback(() => {
    void getWallet()
      .then(setWallet)
      .catch(() => setWallet(null));
  }, []);

  // Angka ringkas profil. Bila gagal dimuat, angkanya ditampilkan sebagai "—",
  // bukan diganti nilai contoh.
  const fetchStats = React.useCallback(() => {
    void getProfileStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const load = React.useCallback(async () => {
    try {
      const profile = await getMyProfile();
      if (profile) {
        setState({ kind: 'ready', profile });
      } else {
        setState({
          kind: 'ready',
          profile: {
            ...DEFAULT_PROFILE,
            displayName: user?.displayName || DEFAULT_PROFILE.displayName,
          },
        });
      }
    } catch (err) {
      console.warn('Gagal memuat profil dari server, menggunakan fallback:', err);
      setState({
        kind: 'ready',
        profile: {
          ...DEFAULT_PROFILE,
          displayName: user?.displayName || DEFAULT_PROFILE.displayName,
        },
      });
    }
  }, [user]);

  useDeferredEffect(() => {
    void load();
    fetchWallet();
    fetchStats();
  }, [load, fetchWallet, fetchStats]);

  function retry() {
    setState({ kind: 'loading' });
    void load();
    fetchWallet();
  }

  if (state.kind === 'loading') return <SkeletonList count={3} />;
  if (state.kind === 'error') {
    return (
      <ErrorState
        title="Tidak dapat memuat profil"
        description="Periksa koneksi internet kamu lalu coba lagi."
        onRetry={retry}
      />
    );
  }

  const activeProfile = state.profile;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground">Profil</h1>
        <Link href="/profil/edit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit profil
        </Link>
      </div>

      <Card className="flex flex-col gap-4 bg-background">
        <div className="flex items-center gap-4">
          <Avatar name={activeProfile.displayName} avatarId={activeProfile.avatarId} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-foreground">{activeProfile.displayName}</p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              {activeProfile.cityVisible ? (
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              ) : (
                <MapPinOff className="size-3.5" aria-hidden="true" />
              )}
              {cityLabel(activeProfile.cityId)}
              {!activeProfile.cityVisible && ' (hanya terlihat olehmu)'}
            </p>
          </div>
        </div>

        {/*
          Tiga angka ringkas. Semuanya berasal dari backend; sebelumnya "Pertemuan" dan
          "Ajakan" adalah angka tetap yang sama untuk setiap pengguna.

          Pertemuan tidak dapat diklik karena belum ada halaman riwayat pertemuan yang
          datanya nyata; dua lainnya menuju halaman yang memang sudah ada isinya.
        */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-mint/50 text-center">
          <div className="flex flex-col items-center justify-center py-3">
            <span className="text-lg font-extrabold text-foreground">{stats?.meetings ?? '—'}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">Pertemuan</span>
          </div>

          <Link
            href="/profil/ajakan"
            className="flex flex-col items-center justify-center py-3 transition-colors hover:bg-mint"
          >
            <span className="text-lg font-extrabold text-foreground">{stats?.activities ?? '—'}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">Ajakan</span>
          </Link>

          <Link
            href="/hadiah"
            className="flex flex-col items-center justify-center py-3 transition-colors hover:bg-mint"
          >
            <span className="text-lg font-extrabold text-secondary">
              {stats?.giftsReceived ?? '—'}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">Hadiah</span>
          </Link>
        </div>

        {activeProfile.bio && (
          <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl">{activeProfile.bio}</p>
        )}

        {activeProfile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {activeProfile.interests.map((id) => (
              <div
                key={id}
                className="inline-flex items-center gap-2 rounded-2xl bg-mint/50 border border-mint-strong/40 py-1 pl-1.5 pr-3 text-xs font-semibold text-foreground shadow-2xs"
              >
                {INTEREST_IMAGE_SRC[id as InterestId] && (
                  <Image
                    src={INTEREST_IMAGE_SRC[id as InterestId]}
                    alt=""
                    width={32}
                    height={32}
                    className="size-7 rounded-full object-contain shrink-0"
                  />
                )}
                <span>{interestLabel(id)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

          {/* Widget Dompet Coin (Screen 26) */}
          <Card className="flex flex-col gap-3 bg-gradient-to-r from-mint via-mint/80 to-background border-primary/20">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warning-soft text-warning-soft-foreground border border-coin/30 shadow-xs">
                <Coins className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Saldo Coin Komunitas
                </span>
                <p className="text-lg font-extrabold text-foreground">
                  {wallet ? `${wallet.balance.toLocaleString('id-ID')} Coin` : 'Memuat…'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => setOpenTopupModal(true)} className="shadow-xs whitespace-nowrap">
                <Plus className="size-3.5" />
                Top Up
              </Button>
              <Link
                href="/dompet"
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'bg-background whitespace-nowrap' })}
              >
                <Wallet className="size-3.5" />
                Dompet
              </Link>
            </div>
          </Card>

          {/* Menu Profil (Screen 24) */}
          <Card className="flex flex-col divide-y divide-border p-0 overflow-hidden bg-background">
            <Link href="/profil/edit" className="flex items-center justify-between p-3.5 hover:bg-mint/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-mint text-primary">
                  <Pencil className="size-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Edit Profil Avatar</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>

            <Link href="/profil/riwayat" className="flex items-center justify-between p-3.5 hover:bg-mint/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FaIcon icon="fa-clock-rotate-left" className="text-xs" />
                </div>
                <span className="text-xs font-bold text-foreground">Riwayat Aktivitas</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>

            <Link href="/mitra" className="flex items-center justify-between p-3.5 hover:bg-mint/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <FaIcon icon="fa-store" className="text-xs" />
                </div>
                <span className="text-xs font-bold text-foreground">Portal Mitra (Venue Partner)</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>

            <Link href="/profil/pengaturan" className="flex items-center justify-between p-3.5 hover:bg-mint/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-mint text-primary">
                  <FaIcon icon="fa-gear" className="text-xs" />
                </div>
                <span className="text-xs font-bold text-foreground">Pengaturan & Privasi</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </Card>

      <TopupModal
        open={openTopupModal}
        onClose={() => setOpenTopupModal(false)}
        onSuccess={fetchWallet}
      />
    </div>
  );
}
