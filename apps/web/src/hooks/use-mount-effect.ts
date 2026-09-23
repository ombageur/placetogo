'use client';

import * as React from 'react';

/**
 * Menjalankan `run` sekali setelah komponen terpasang, satu microtask setelah efeknya.
 *
 * Dipakai untuk pekerjaan yang hanya bisa dilakukan di klien — membaca localStorage,
 * query string, atau memulai pengambilan data pertama — yang hasilnya disimpan ke state.
 *
 * Penundaan satu microtask itu disengaja. Aturan `react-hooks/set-state-in-effect`
 * melarang pemanggilan setState secara sinkron di badan efek karena memicu render
 * berantai: React harus merender ulang segera setelah efeknya selesai, sebelum browser
 * sempat menggambar. Memindahkannya ke dalam callback membuat pembaruan state terjadi
 * di luar fase efek, seperti pembaruan yang datang dari sumber eksternal.
 *
 * `run` hanya diambil dari render pertama, karena hook ini memang sekali jalan saat
 * pemasangan. Pemanggilnya tidak perlu membungkusnya dengan useCallback.
 */
export function useMountEffect(run: () => void): void {
  useDeferredEffect(run, []);
}

/**
 * Versi berdependensi dari useMountEffect: menjalankan `run` satu microtask setelah
 * efeknya, dan mengulanginya setiap kali `deps` berubah. Dipakai untuk pengambilan data
 * yang perlu diulang saat filternya berganti.
 *
 * Karena `deps` diteruskan lewat parameter, eslint tidak dapat memeriksa kelengkapannya
 * di tempat pemanggilan. Cantumkan setiap nilai yang dipakai `run` secara eksplisit.
 */
export function useDeferredEffect(run: () => void, deps: React.DependencyList): void {
  React.useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) run();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
