'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { INTEREST_CATALOG, type InterestId } from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { cn } from '@/lib/utils';
import { getOnboardingDraft, saveOnboardingDraft } from '@/components/onboarding/onboarding-state';
import { useMountEffect } from '@/hooks/use-mount-effect';
import { INTEREST_IMAGE_SRC } from '@/components/profile/interest-images';

/**
 * Screen 10: Pilih Minat (Apa yang kamu suka?)
 * Menampilkan 12 minat resmi dengan ikon ilustrasi, syarat minimal 1 dan maksimal 8 pilihan, tombol Lanjut.
 */
export function InterestsStepView() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<InterestId[]>(['ngobrol', 'kuliner', 'olahraga']);

  useMountEffect(() => {
    const draft = getOnboardingDraft();
    if (draft.interests && draft.interests.length > 0) setSelected(draft.interests);
  });

  function toggleInterest(id: InterestId) {
    let next: InterestId[];
    if (selected.includes(id)) {
      next = selected.filter((item) => item !== id);
    } else {
      if (selected.length >= 8) return; // batas skema
      next = [...selected, id];
    }
    setSelected(next);
    saveOnboardingDraft({ interests: next });
  }

  function handleBack() {
    router.push('/onboarding/lokasi');
  }

  function handleContinue() {
    if (selected.length < 1) return;
    saveOnboardingDraft({ interests: selected });
    router.push('/onboarding/area');
  }

  const isValid = selected.length >= 1;

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-mint hover:text-primary transition-colors -ml-2"
          aria-label="Kembali ke izin lokasi"
        >
          <FaIcon icon="fa-chevron-left" className="text-base" />
        </button>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-mint text-primary">
          {selected.length} / 8 dipilih
        </span>
      </div>

      {/* Header Judul */}
      <div className="flex flex-col gap-1.5">
        <h1 className="tracking-tight text-foreground">
          Apa yang kamu suka?
        </h1>
        <p className="text-sm text-muted-foreground">
          Pilih 1–8 minat yang sesuai dengan kepribadianmu.
        </p>
      </div>

      {/* Grid 12 Minat Resmi */}
      <div
        role="group"
        aria-label="Pilih minat aktivitas"
        className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1"
      >
        {INTEREST_CATALOG.map(({ id, label }) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => toggleInterest(id)}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border p-2.5 sm:p-3 text-center transition-all',
                isSelected
                  ? 'border-primary bg-mint-strong/60 text-primary ring-2 ring-primary/30 shadow-xs scale-[1.02]'
                  : 'border-border-strong bg-background text-foreground hover:border-primary/40 hover:bg-mint/20',
              )}
            >
              <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-full transition-transform">
                <Image
                  src={INTEREST_IMAGE_SRC[id]}
                  alt=""
                  width={56}
                  height={56}
                  className="size-full object-contain"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tombol Lanjut */}
      <div className="pt-3 flex flex-col gap-2">
        <Button
          type="button"
          fullWidth
          size="lg"
          disabled={!isValid}
          onClick={handleContinue}
          className="gap-2 text-base font-semibold shadow-sm"
        >
          <span>Lanjut</span>
          <FaIcon icon="fa-arrow-right" className="text-sm" />
        </Button>
        {!isValid && (
          <p className="text-center text-xs text-muted-foreground">
            Pilih minimal 1 minat untuk melanjutkan.
          </p>
        )}
      </div>
    </div>
  );
}
