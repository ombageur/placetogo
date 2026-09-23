import Image from 'next/image';
import { cn } from '@/lib/utils';

/*
 * Aset merek resmi ada di apps/web/public/brand/ (lihat docs/design/logo.md).
 * Ukurannya diatur lewat tinggi; lebarnya mengikuti rasio asli, jadi jangan memakai
 * utilitas persegi seperti size-* pada komponen ini.
 */

const MARK = { src: '/brand/placetogo-mark.webp', width: 237, height: 147 };
const LOCKUP = { src: '/brand/placetogo-logo-trimmed.webp', width: 726, height: 147 };
/*
 * Varian bertagline hanya dipakai di layar yang ruangnya lega (splash dan auth).
 * Pada header setinggi 28px taglinenya akan mengecil sampai tidak terbaca, jadi di sana
 * dipakai varian tanpa tagline.
 */
const LOCKUP_TAGLINE = { src: '/brand/placetogo-logo-tagline.webp', width: 726, height: 147 };

/** Logomark: sepasang gelembung percakapan, tanpa tulisan. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={MARK.src}
      width={MARK.width}
      height={MARK.height}
      alt=""
      aria-hidden="true"
      priority
      className={cn('h-8 w-auto', className)}
    />
  );
}

/**
 * Logo penuh: gelembung dan tulisan "placetogo".
 * `alt` dikosongkan bila elemen pembungkusnya sudah menyebutkan merek, misalnya tautan
 * beranda yang memakai aria-label, supaya pembaca layar tidak mengumumkannya dua kali.
 */
export function Logo({
  className,
  alt = 'placetogo',
  withTagline = false,
}: {
  className?: string;
  alt?: string;
  /** Menampilkan tagline "Ngobrol, Nongkrong, Jadi Cerita" di bawah tulisan merek. */
  withTagline?: boolean;
}) {
  const lockup = withTagline ? LOCKUP_TAGLINE : LOCKUP;
  return (
    <Image
      src={lockup.src}
      width={lockup.width}
      height={lockup.height}
      alt={alt}
      aria-hidden={alt === '' ? 'true' : undefined}
      priority
      className={cn('h-7 w-auto', className)}
    />
  );
}
