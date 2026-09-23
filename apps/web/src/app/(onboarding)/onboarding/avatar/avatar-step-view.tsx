'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_CATALOG, type AvatarId } from '@placetogo/shared';
import Image from 'next/image';
import { AVATAR_IMAGE_SIZE, AVATAR_IMAGE_SRC } from '@/components/profile/avatar-images';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { cn } from '@/lib/utils';
import { getOnboardingDraft, saveOnboardingDraft } from '@/components/onboarding/onboarding-state';
import { useMountEffect } from '@/hooks/use-mount-effect';

/**
 * Screen 8: Lengkapi Profil (Pilih Avatar)
 * Sesuai referensi UI: Grid 12 avatar resmi, seleksi tunggal dengan highlight ring, tombol Lanjut.
 */
export function AvatarStepView() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = React.useState<AvatarId>('cat');

  useMountEffect(() => {
    const draft = getOnboardingDraft();
    if (draft.avatarId) setSelectedAvatar(draft.avatarId);
  });

  function handleSelect(id: AvatarId) {
    setSelectedAvatar(id);
    saveOnboardingDraft({ avatarId: id });
  }

  function handleContinue() {
    saveOnboardingDraft({ avatarId: selectedAvatar });
    router.push('/onboarding/lokasi');
  }

  function handleBack() {
    router.back();
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Header bar navigasi atas */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-mint hover:text-primary transition-colors -ml-2"
          aria-label="Kembali"
        >
          <FaIcon icon="fa-chevron-left" className="text-base" />
        </button>
        <div className="inline-flex size-9 items-center justify-center rounded-full bg-mint text-primary">
          <FaIcon icon="fa-user" className="text-sm" />
        </div>
      </div>

      {/* Judul & Deskripsi */}
      <div className="flex flex-col gap-1.5">
        <h1 className="tracking-tight text-foreground">
          Pilih avatar kamu
        </h1>
        <p className="text-sm text-muted-foreground">
          Gunakan avatar, bukan foto.
        </p>
      </div>

      {/* Grid 12 Avatar */}
      <div
        role="radiogroup"
        aria-label="Pilih avatar"
        className="grid grid-cols-3 gap-4 sm:grid-cols-4 pt-2"
      >
        {AVATAR_CATALOG.map(({ id, label }) => {
          const isSelected = selectedAvatar === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => handleSelect(id)}
              className={cn(
                'group relative flex aspect-square flex-col items-center justify-center rounded-3xl p-3 sm:p-4 transition-all',
                'bg-mint/40 hover:bg-mint/70',
                isSelected
                  ? 'bg-mint ring-3 ring-primary shadow-md scale-105'
                  : 'hover:scale-[1.02] border border-transparent hover:border-mint-soft',
              )}
            >
              <div className="size-full flex items-center justify-center">
                <Image
                  src={AVATAR_IMAGE_SRC[id]}
                  alt=""
                  width={AVATAR_IMAGE_SIZE}
                  height={AVATAR_IMAGE_SIZE}
                  className="size-16 rounded-full object-cover transition-transform group-hover:scale-105 sm:size-20"
                />
              </div>
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                  <FaIcon icon="fa-check" className="text-xs" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tombol Lanjut */}
      <div className="pt-4">
        <Button
          type="button"
          fullWidth
          size="lg"
          onClick={handleContinue}
          className="gap-2 text-base font-semibold shadow-sm"
        >
          <span>Lanjut</span>
          <FaIcon icon="fa-arrow-right" className="text-sm" />
        </Button>
      </div>
    </div>
  );
}
