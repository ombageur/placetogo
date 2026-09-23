/// <reference types="google.maps" />
import { getPublicEnv } from '@/lib/env';

declare global {
  interface Window {
    google?: typeof google;
    __placetogoMapsCallback?: () => void;
  }
}

let loadPromise: Promise<typeof google.maps> | null = null;

/**
 * Memuat Maps JavaScript API SEKALI (singleton) dengan kunci BROWSER (dibatasi HTTP
 * referrer) — hanya untuk merender peta, TIDAK dipakai untuk Places (itu lewat backend,
 * lihat lib/maps/client.ts). Peta interaktif sengaja hanya dimuat di halaman detail
 * lokasi (bukan tiap kartu ajakan) — lihat docs/discovery/nearby.md.
 */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (loadPromise) return loadPromise;

  const apiKey = getPublicEnv().NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY belum dikonfigurasi.'));
  }
  if (window.google?.maps) {
    loadPromise = Promise.resolve(window.google.maps);
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    window.__placetogoMapsCallback = () => resolve(window.google!.maps);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=__placetogoMapsCallback&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Gagal memuat Google Maps.'));
    document.head.appendChild(script);
  });
  return loadPromise;
}
