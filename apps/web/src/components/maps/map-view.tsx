'use client';

import * as React from 'react';
import { MapPinOff } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/maps/loader';

type MapState = 'loading' | 'ready' | 'unavailable';

/**
 * Peta interaktif sederhana: satu marker pada koordinat yang diberikan. Sengaja hanya
 * dipakai di halaman detail lokasi (satu peta per kunjungan), TIDAK di kartu ajakan —
 * lihat docs/discovery/nearby.md soal biaya per-pemuatan Maps JS. Gagal-anggun bila
 * kunci browser Maps belum dikonfigurasi (mis. di lingkungan pengembangan lokal).
 */
export function MapView({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<MapState>('loading');

  React.useEffect(() => {
    let ignore = false;
    loadGoogleMaps()
      .then((maps) => {
        if (ignore || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        });
        new maps.Marker({ position: { lat, lng }, map, title: label });
        setState('ready');
      })
      .catch(() => {
        if (!ignore) setState('unavailable');
      });
    return () => {
      ignore = true;
    };
  }, [lat, lng, label]);

  if (state === 'unavailable') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-card bg-neutral-soft p-6 text-center text-neutral-soft-foreground">
        <MapPinOff className="size-6" aria-hidden="true" />
        <p className="text-sm">Peta tidak tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Peta lokasi ${label}`}
      className="h-56 w-full rounded-card bg-neutral-soft"
    >
      {state === 'loading' && <span className="sr-only">Memuat peta…</span>}
    </div>
  );
}
