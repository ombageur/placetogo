'use client';

import * as React from 'react';
import Image from 'next/image';

/**
 * Ilustrasi satu slide onboarding.
 *
 * Gambarnya tampil tanpa bingkai maupun latar: ilustrasinya sudah berlatar transparan dan
 * menyatu langsung dengan kanvas halaman. Lebarnya mengisi ruang yang tersedia agar terbaca
 * besar di layar ponsel.
 *
 * Ukuran asli tiap berkas diteruskan lewat `width` dan `height` supaya rasionya benar dan
 * tidak terjadi pergeseran tata letak saat gambarnya selesai dimuat.
 *
 * Selama berkasnya belum ada, komponen ini menampilkan `fallback` berupa komposisi ikon,
 * bukan ruang kosong. Kegagalan pemuatan juga jatuh ke cadangan yang sama.
 */
export function OnboardingIllustration({
  src,
  alt,
  width,
  height,
  fallback,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority
      sizes="(max-width: 640px) 92vw, 420px"
      onError={() => setFailed(true)}
      className="h-auto w-full max-w-[26rem]"
    />
  );
}
