'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { saveOnboardingDraft } from '@/components/onboarding/onboarding-state';

/**
 * Screen 9: Izin Lokasi (Lokasi & Preferensi)
 * Sesuai referensi UI: Visual ilustrasi smartphone + pin GPS dalam lingkaran mint,
 * tombol "Aktifkan Lokasi" & tombol "Nanti Saja".
 */
export function LocationStepView() {
  const router = useRouter();
  const [requesting, setRequesting] = React.useState(false);

  function handleBack() {
    router.push('/onboarding/avatar');
  }

  function handleSkip() {
    saveOnboardingDraft({ locationGranted: false });
    router.push('/onboarding/minat');
  }

  function handleEnableLocation() {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      handleSkip();
      return;
    }

    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveOnboardingDraft({
          locationGranted: true,
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });
        setRequesting(false);
        router.push('/onboarding/minat');
      },
      (_err) => {
        // Jika izin ditolak atau gagal, tetap lanjutkan dengan ramah
        saveOnboardingDraft({ locationGranted: false });
        setRequesting(false);
        router.push('/onboarding/minat');
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col justify-between py-2">
      {/* Top bar */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-mint hover:text-primary transition-colors -ml-2"
          aria-label="Kembali ke pilih avatar"
        >
          <FaIcon icon="fa-chevron-left" className="text-base" />
        </button>
      </div>

      {/* Konten Utama Terpusat */}
      <div className="flex flex-col items-center text-center gap-6 my-auto px-2">
        {/* Ilustrasi Lingkaran Mint dengan Smartphone & Pin GPS */}
        <div className="relative flex size-48 sm:size-56 items-center justify-center rounded-full bg-mint/50 ring-12 ring-mint/20">
          {/* Aksen hiasan pohon dan radar */}
          <div className="absolute top-6 right-8 text-primary/30">
            <FaIcon icon="fa-tree" className="text-xl" />
          </div>
          <div className="absolute bottom-8 left-7 text-primary/30">
            <FaIcon icon="fa-tree" className="text-lg" />
          </div>

          {/* Bingkai Smartphone */}
          <div className="relative flex h-32 w-20 flex-col items-center justify-center rounded-2xl border-2 border-primary bg-background shadow-md">
            {/* Notch HP */}
            <div className="absolute top-1.5 h-1 w-6 rounded-full bg-border-strong" />

            {/* Pin Lokasi Besar di Layar HP */}
            <div className="flex size-11 items-center justify-center rounded-full bg-mint text-primary">
              <FaIcon icon="fa-location-dot" className="text-xl text-primary animate-bounce" />
            </div>

            {/* Indikator Home Bar */}
            <div className="absolute bottom-1.5 h-0.5 w-7 rounded-full bg-border-strong" />
          </div>
        </div>

        {/* Teks Judul & Deskripsi */}
        <div className="flex flex-col gap-2 max-w-xs sm:max-w-sm">
          <h1 className="tracking-tight text-foreground">
            Aktifkan lokasi
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kami menggunakan lokasi untuk menampilkan aktivitas di sekitarmu.
          </p>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={requesting}
          onClick={handleEnableLocation}
          className="gap-2 text-base font-semibold shadow-sm"
        >
          <FaIcon icon="fa-location-crosshairs" className="text-sm" />
          <span>Aktifkan Lokasi</span>
        </Button>

        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-muted-foreground hover:bg-mint/40 hover:text-foreground transition-colors"
        >
          Nanti Saja
        </button>
      </div>
    </div>
  );
}
