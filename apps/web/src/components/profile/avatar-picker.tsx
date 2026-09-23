'use client';

import { AVATAR_CATALOG, type AvatarId } from '@placetogo/shared';
import Image from 'next/image';
import { AVATAR_IMAGE_SIZE, AVATAR_IMAGE_SRC } from './avatar-images';
import { cn } from '@/lib/utils';

export function AvatarPicker({
  value,
  onChange,
  error,
}: {
  value: AvatarId | undefined;
  onChange: (id: AvatarId) => void;
  error?: string;
}) {
  const describedBy = error ? 'avatar-picker-error' : undefined;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-foreground">Pilih avatar kamu</span>
      <p className="text-sm text-muted-foreground">Tunjukkan kepribadianmu lewat ikon.</p>
      <div role="radiogroup" aria-label="Pilih avatar" aria-describedby={describedBy} className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {AVATAR_CATALOG.map(({ id, label }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              onClick={() => onChange(id)}
              className={cn(
                'flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 transition-colors',
                selected ? 'border-primary' : 'border-transparent hover:border-border-strong',
              )}
            >
              <Image
                src={AVATAR_IMAGE_SRC[id]}
                alt=""
                width={AVATAR_IMAGE_SIZE}
                height={AVATAR_IMAGE_SIZE}
                className="size-full object-cover"
              />
            </button>
          );
        })}
      </div>
      {error && (
        <p id="avatar-picker-error" role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
