'use client';

import * as React from 'react';
import type { LatLng } from '@placetogo/shared';

export class GeolocationDeniedError extends Error {}
export class GeolocationUnavailableError extends Error {}

/**
 * Meminta lokasi pengguna (izin browser bawaan `navigator.geolocation`, BUKAN Google API
 * apa pun). `requestPosition()` mengembalikan Promise agar pemanggilnya (mis. handler
 * klik tab "Terdekat") bisa memakai async/await lalu memperbarui state feed sendiri —
 * hook ini sengaja tidak menyimpan/memicu setState internal supaya alurnya tetap berada
 * dalam konteks event handler, bukan badan efek.
 */
export function useGeolocation(): { requestPosition: () => Promise<LatLng> } {
  const requestPosition = React.useCallback((): Promise<LatLng> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new GeolocationUnavailableError('Geolocation tidak didukung peramban ini.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) reject(new GeolocationDeniedError('Izin lokasi ditolak.'));
          else reject(new GeolocationUnavailableError('Tidak dapat mengambil lokasi.'));
        },
        { timeout: 10_000, maximumAge: 60_000 },
      );
    });
  }, []);

  return { requestPosition };
}
