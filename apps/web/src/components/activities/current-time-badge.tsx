'use client';

import * as React from 'react';

/**
 * Penanda jam sekarang di sisi kanan bilah filter Jelajah.
 *
 * Gunanya memberi titik acuan saat membaca daftar yang dikelompokkan per jam: pengguna bisa
 * langsung tahu kelompok mana yang sudah lewat dan mana yang sebentar lagi.
 *
 * Jamnya baru dirender setelah komponen terpasang di klien. Merendernya saat render pertama
 * akan membuat keluaran server dan klien berbeda, karena waktunya pasti sudah bergeser.
 */
export function CurrentTimeBadge({ className }: { className?: string }) {
  const [now, setNow] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const at = new Date();
      setNow(`${String(at.getHours()).padStart(2, '0')}.${String(at.getMinutes()).padStart(2, '0')}`);
    };
    // Dipanggil lewat microtask agar setState tidak terjadi sinkron di badan efek.
    void Promise.resolve().then(tick);
    const timer = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!now) return null;

  return (
    <span
      className={className}
      // Pembaca layar tidak perlu diberi tahu setiap kali menitnya berganti.
      aria-live="off"
    >
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full bg-success align-middle"
      />{' '}
      Sekarang {now}
    </span>
  );
}
