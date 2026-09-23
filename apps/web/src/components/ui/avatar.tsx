import Image from 'next/image';
import type { AvatarId } from '@placetogo/shared';
export type { AvatarId };
import { AVATAR_IMAGE_SIZE, AVATAR_IMAGE_SRC } from '@/components/profile/avatar-images';
import { cn } from '@/lib/utils';

const TONES = [
  'bg-mint text-primary',
  'bg-info-soft text-info-soft-foreground',
  'bg-warning-soft text-warning-soft-foreground',
  'bg-neutral-soft text-neutral-soft-foreground',
];
const SIZES = { sm: 'size-8 text-xs', md: 'size-11 text-base', lg: 'size-16 text-xl' } as const;

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export interface AvatarProps {
  /** Nama tampilan: dipakai untuk inisial (fallback) dan teks alternatif. */
  name: string;
  /** Bila ada, merender ilustrasi avatar dari katalog alih-alih inisial. */
  avatarId?: AvatarId;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * Avatar: merender ilustrasi dari katalog bila `avatarId` diberikan (profil yang sudah
 * lengkap), atau inisial nama sebagai fallback (mis. sebelum profil diisi, atau untuk
 * peserta lain yang datanya belum dimuat).
 *
 * Ilustrasinya sudah berbentuk lingkaran dengan latar mint sendiri, jadi wadahnya cukup
 * memotong tepinya tanpa menambah warna latar lagi.
 */
export function Avatar({ name, avatarId, size = 'md', className }: AvatarProps) {
  const src = avatarId ? AVATAR_IMAGE_SRC[avatarId] : undefined;
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold',
        SIZES[size],
        src ? 'bg-transparent' : TONES[hash(name) % TONES.length],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={AVATAR_IMAGE_SIZE}
          height={AVATAR_IMAGE_SIZE}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
