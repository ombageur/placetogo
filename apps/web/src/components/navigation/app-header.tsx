'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CITY_CATALOG, type AvatarId, type CityId } from '@placetogo/shared';
import { Logo } from '@/components/brand/logo';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/components/auth/auth-provider';
import { getMyProfile } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CITY_CHANGE_EVENT, HEADER_CITY_KEY, readStoredCity } from '@/lib/city-preference';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

export function AppHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const { account } = useAuth();
  const [selectedCity, setSelectedCity] = React.useState<CityId>('surabaya');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [avatarId, setAvatarId] = React.useState<AvatarId | undefined>();

  useDeferredEffect(() => {
    // Muat kota tersimpan di localStorage atau profil
    const saved = readStoredCity();
    if (saved) setSelectedCity(saved);

    if (account.kind === 'ready') {
      void getMyProfile().then((p) => {
        if (p?.avatarId) setAvatarId(p.avatarId);
        if (p?.cityId && !saved) {
          setSelectedCity(p.cityId);
          localStorage.setItem(HEADER_CITY_KEY, p.cityId);
        }
      }).catch(() => {});
    }
  }, [account]);

  function handleSelectCity(cityId: CityId) {
    setSelectedCity(cityId);
    localStorage.setItem(HEADER_CITY_KEY, cityId);
    setModalOpen(false);
    // Trigger custom event untuk komponen yang mendengarkan perubahan kota
    window.dispatchEvent(new CustomEvent(CITY_CHANGE_EVENT, { detail: { cityId } }));
  }

  const currentCityLabel = CITY_CATALOG.find((c) => c.id === selectedCity)?.label ?? 'Surabaya';
  const isHomeOrDiscovery = pathname === '/' || pathname.startsWith('/jelajah');

  return (
    <>
      <header className={cn('sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border/50 bg-background/95 px-4 backdrop-blur-md', className)}>
        {/* Brand Logo */}
        <Link href="/" aria-label="placetogo.id, ke Beranda" className="inline-flex min-h-11 items-center">
          <Logo className="h-7" alt="" />
        </Link>

        {/* City Selector Pill (Screens 12 & 13) */}
        {isHomeOrDiscovery && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-mint/50 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-mint hover:border-primary/30 transition-all shadow-xs active:scale-95"
            aria-label={`Kota aktif: ${currentCityLabel}. Klik untuk mengganti kota.`}
          >
            <FaIcon icon="fa-location-dot" className="text-xs text-primary" />
            <span>{currentCityLabel}</span>
            <FaIcon icon="fa-chevron-down" className="text-[10px] text-primary/70 ml-0.5" />
          </button>
        )}

        {/* Right Actions: Notifikasi & Avatar */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/notifikasi"
            aria-label="Pusat Notifikasi"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-mint hover:text-primary transition-colors"
          >
            <FaIcon icon="fa-bell" className="text-sm" />
          </Link>
          <Link
            href="/profil"
            aria-label="Profil Saya"
            className="group flex size-11 items-center justify-center rounded-full"
          >
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border transition-all group-hover:ring-2 group-hover:ring-primary/20">
              {avatarId ? (
                <Avatar avatarId={avatarId} name="Profil" size="sm" className="size-8" />
              ) : (
                <FaIcon icon="fa-user" className="text-xs text-muted-foreground" />
              )}
            </span>
          </Link>
        </div>
      </header>

      {/* Modal Pemilih Kota */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pilih Area Aktivitas">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Pilih kota untuk melihat ajakan nongkrong dan komunitas terdekat di sekitarmu:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {CITY_CATALOG.map((city) => {
              const selected = city.id === selectedCity;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city.id)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-2xl border text-left transition-all text-xs font-semibold',
                    selected
                      ? 'border-primary bg-mint text-primary font-bold shadow-xs'
                      : 'border-border bg-background text-foreground hover:bg-mint/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FaIcon
                      icon="fa-location-dot"
                      className={cn('text-xs', selected ? 'text-primary' : 'text-muted-foreground')}
                    />
                    <span>{city.label}</span>
                  </div>
                  {selected && <FaIcon icon="fa-check" className="text-xs text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
