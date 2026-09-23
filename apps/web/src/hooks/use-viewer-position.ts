'use client';

import * as React from 'react';
import type { LatLng } from '@placetogo/shared';

const CACHE_KEY = 'placetogo_viewer_position';
const MAX_AGE_MS = 30 * 60 * 1000;

type Cached = { lat: number; lng: number; at: number };

function readCache(): LatLng | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') return null;
    if (Date.now() - parsed.at > MAX_AGE_MS) return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

function writeCache(position: LatLng) {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...position, at: Date.now() }));
  } catch {
    // Penyimpanan sesi bisa diblokir; jarak cukup dihitung ulang saat kunjungan berikutnya.
  }
}

/**
 * Lokasi pengguna untuk keperluan tampilan jarak pada kartu ajakan.
 *
 * Berbeda dari useGeolocation yang sengaja meminta izin saat pengguna menekan sesuatu,
 * hook ini **tidak pernah memunculkan dialog izin**: ia hanya memakai lokasi bila izinnya
 * sudah diberikan sebelumnya, atau bila masih ada hasil yang tersimpan di sesi ini.
 * Dengan begitu jarak muncul untuk pengguna yang sudah mengizinkan lokasi, tanpa mengganggu
 * pengguna yang belum.
 *
 * Mengembalikan null bila lokasi tidak diketahui; pemanggilnya menyembunyikan jaraknya.
 */
export function useViewerPosition(): LatLng | null {
  const [position, setPosition] = React.useState<LatLng | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function resolvePosition(): Promise<LatLng | null> {
      const cached = readCache();
      if (cached) return cached;
      if (typeof navigator === 'undefined' || !navigator.geolocation || !navigator.permissions) return null;

      const status = await navigator.permissions.query({ name: 'geolocation' }).catch(() => null);
      if (status?.state !== 'granted') return null;

      return new Promise<LatLng | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            writeCache(next);
            resolve(next);
          },
          () => resolve(null),
          { timeout: 10_000, maximumAge: 5 * 60_000 },
        );
      });
    }

    void resolvePosition().then((next) => {
      if (!cancelled && next) setPosition(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return position;
}
