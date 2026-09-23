import type { ActivityCategoryId, CityId, LatLng } from '@placetogo/shared';
import { fetchDiscoveryPage, fetchNearbyActivities, fetchRecentPage, fetchSearchPage, type DiscoveryCursor, type DiscoveryPage } from './read';

export type DiscoveryQuery =
  | { kind: 'browse'; categoryId?: ActivityCategoryId; cityId?: CityId }
  | { kind: 'recent' }
  | { kind: 'search'; text: string }
  /** Sudah dapat lokasi pengguna; lihat lib/activities/read.ts#fetchNearbyActivities. */
  | { kind: 'nearby'; center: LatLng; radiusKm?: number }
  /** Placeholder sebelum lokasi pengguna didapat/diizinkan (lihat use-geolocation.ts). */
  | { kind: 'unavailable' };

export function fetchPageFor(q: DiscoveryQuery, cursor: DiscoveryCursor | null): Promise<DiscoveryPage> {
  switch (q.kind) {
    case 'browse':
      return fetchDiscoveryPage({ categoryId: q.categoryId, cityId: q.cityId }, cursor);
    case 'recent':
      return fetchRecentPage(cursor);
    case 'search':
      return fetchSearchPage(q.text, cursor);
    case 'nearby':
      // Tanpa cursor: satu pengambilan tergabung dari beberapa sel geohash, sudah terurut
      // jarak (lihat dokumentasi fetchNearbyActivities). "Muat lebih banyak" tidak berlaku.
      return fetchNearbyActivities(q.center, q.radiusKm).then((page) => ({ items: page.items, cursor: null, readCount: page.readCount }));
    case 'unavailable':
      return Promise.resolve({ items: [], cursor: null, readCount: 0 });
  }
}

/** Kunci stabil untuk membandingkan dua query (dipakai efek/memo). */
export function discoveryQueryKey(q: DiscoveryQuery): string {
  switch (q.kind) {
    case 'browse':
      return `browse:${q.categoryId ?? ''}:${q.cityId ?? ''}`;
    case 'recent':
      return 'recent';
    case 'search':
      return `search:${q.text.trim().toLowerCase()}`;
    case 'nearby':
      return `nearby:${q.center.lat.toFixed(4)}:${q.center.lng.toFixed(4)}:${q.radiusKm ?? ''}`;
    case 'unavailable':
      return 'unavailable';
  }
}
