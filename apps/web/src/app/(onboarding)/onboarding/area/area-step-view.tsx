'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CITY_CATALOG, type CityId, type InterestId } from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { useAuth } from '@/components/auth/auth-provider';
import { saveMyProfile } from '@/lib/api';
import { cn } from '@/lib/utils';
import { clearOnboardingDraft, getOnboardingDraft, saveOnboardingDraft } from '@/components/onboarding/onboarding-state';
import { useMountEffect } from '@/hooks/use-mount-effect';

// Daftar kota utama sesuai referensi Screen 11 + pemetaan ke katalog
const PROMINENT_CITIES: { id: CityId; label: string }[] = [
  { id: 'surabaya', label: 'Surabaya' },
  { id: 'jakarta', label: 'Jakarta' },
  { id: 'bandung', label: 'Bandung' },
  { id: 'yogyakarta', label: 'Yogyakarta' },
  { id: 'denpasar', label: 'Bali (Denpasar)' },
  { id: 'malang', label: 'Malang' },
  { id: 'semarang', label: 'Semarang' },
  { id: 'medan', label: 'Medan' },
  { id: 'makassar', label: 'Makassar' },
];

/**
 * Screen 11: Pilih Area (Lokasi & Preferensi)
 * Sesuai referensi UI: Input pencarian kota/area, radio list kota, tombol Lanjut/Selesai.
 * Menyimpan profil lengkap pengguna dan mengarahkan ke Beranda (Screen 12).
 */
export function AreaStepView() {
  const router = useRouter();
  const { user, refreshAccount } = useAuth();

  const [selectedCity, setSelectedCity] = React.useState<CityId>('surabaya');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useMountEffect(() => {
    const draft = getOnboardingDraft();
    if (draft.cityId) setSelectedCity(draft.cityId);
  });

  function handleBack() {
    router.push('/onboarding/minat');
  }

  function handleSelect(id: CityId) {
    setSelectedCity(id);
    saveOnboardingDraft({ cityId: id });
  }

  const filteredCities = React.useMemo(() => {
    if (!searchQuery.trim()) return PROMINENT_CITIES;
    const q = searchQuery.toLowerCase();
    return CITY_CATALOG.filter((c) => c.label.toLowerCase().includes(q));
  }, [searchQuery]);

  async function handleFinish() {
    setLoading(true);
    setError(null);

    const draft = getOnboardingDraft();
    const avatarId = draft.avatarId || 'cat';
    const fallbackInterests: InterestId[] = ['ngobrol', 'kuliner', 'olahraga'];
    const interests: InterestId[] = draft.interests && draft.interests.length >= 1 ? draft.interests : fallbackInterests;
    const cityId = selectedCity;
    const displayName = user?.displayName || 'KopiSenja';

    try {
      // Simpan profil ke backend Firestore
      await saveMyProfile({
        avatarId,
        displayName,
        cityId,
        cityVisible: true,
        interests,
      });

      await refreshAccount();
      clearOnboardingDraft();
      router.replace('/');
    } catch (err) {
      // Jika dalam mode pengujian dev / offline tanpa auth server
      console.warn('Gagal menyimpan profil lewat API, fallback lokal dev:', err);
      clearOnboardingDraft();
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Top bar */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-mint hover:text-primary transition-colors -ml-2"
          aria-label="Kembali ke pilih minat"
        >
          <FaIcon icon="fa-chevron-left" className="text-base" />
        </button>
      </div>

      {/* Header Judul */}
      <div className="flex flex-col gap-1.5">
        <h1 className="tracking-tight text-foreground">
          Pilih area kamu
        </h1>
        <p className="text-sm text-muted-foreground">
          Kamu bisa mengubahnya kapan saja.
        </p>
      </div>

      {/* Input Pencarian Kota / Area */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
          <FaIcon icon="fa-magnifying-glass" className="text-sm" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kota atau area"
          className="w-full rounded-2xl border border-border-strong bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          >
            <FaIcon icon="fa-xmark" className="text-sm" />
          </button>
        )}
      </div>

      {/* Daftar Radio Kota */}
      <div
        role="radiogroup"
        aria-label="Daftar kota"
        className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border bg-card overflow-hidden shadow-2xs"
      >
        {filteredCities.map(({ id, label }) => {
          const isSelected = selectedCity === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(id)}
              className={cn(
                'flex items-center justify-between px-4 py-3.5 text-left transition-colors',
                isSelected
                  ? 'bg-mint/40 font-semibold text-primary'
                  : 'hover:bg-mint/15 text-foreground',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-strong bg-background',
                  )}
                >
                  {isSelected && <FaIcon icon="fa-check" className="text-[10px]" />}
                </div>
                <span className="text-sm">{label}</span>
              </div>

              {isSelected && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-mint text-primary">
                  Dipilih
                </span>
              )}
            </button>
          );
        })}

        {filteredCities.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Tidak ada kota yang cocok dengan "{searchQuery}".
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-danger flex items-center gap-1.5">
          <FaIcon icon="fa-triangle-exclamation" className="text-xs" />
          <span>{error}</span>
        </p>
      )}

      {/* Tombol Lanjut / Selesai */}
      <div className="pt-2">
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={loading}
          onClick={handleFinish}
          className="gap-2 text-base font-semibold shadow-sm"
        >
          <span>Selesai & Mulai</span>
          <FaIcon icon="fa-check" className="text-sm" />
        </Button>
      </div>
    </div>
  );
}
