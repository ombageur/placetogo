/**
 * Geohash dan util geospasial murni (tanpa dependensi Firebase/Google). Dipakai untuk
 * query "Terdekat": Firestore tidak punya tipe geospasial asli, jadi lokasi disimpan
 * sebagai string geohash lalu di-query lewat beberapa rentang prefix (pola standar
 * GeoFire) dan disaring ulang dengan jarak sungguhan (Haversine) di klien.
 *
 * Lihat docs/discovery/nearby.md untuk penjelasan lengkap dan batasannya.
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
/** Presisi penyimpanan tetap untuk field `geohash` di setiap dokumen aktivitas (~5x5 m). */
export const GEOHASH_STORAGE_PRECISION = 9;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeohashBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

function assertValidLatLng({ lat, lng }: LatLng): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error(`Latitude tidak valid: ${lat}`);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error(`Longitude tidak valid: ${lng}`);
}

/** Meng-encode koordinat menjadi geohash base32 sepanjang `precision` karakter. */
export function encodeGeohash({ lat, lng }: LatLng, precision = GEOHASH_STORAGE_PRECISION): string {
  assertValidLatLng({ lat, lng });
  if (!Number.isInteger(precision) || precision < 1 || precision > 12) {
    throw new Error(`precision harus 1-12, diterima: ${precision}`);
  }
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let hash = '';
  let bit = 0;
  let charIndex = 0;
  let evenBit = true; // bit pertama selalu longitude

  while (hash.length < precision) {
    if (evenBit) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        charIndex = (charIndex << 1) | 1;
        lngRange = [mid, lngRange[1]];
      } else {
        charIndex <<= 1;
        lngRange = [lngRange[0], mid];
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        charIndex = (charIndex << 1) | 1;
        latRange = [mid, latRange[1]];
      } else {
        charIndex <<= 1;
        latRange = [latRange[0], mid];
      }
    }
    evenBit = !evenBit;
    bit++;
    if (bit === 5) {
      hash += BASE32[charIndex];
      bit = 0;
      charIndex = 0;
    }
  }
  return hash;
}

/** Kebalikan `encodeGeohash`: kotak batas lat/lng yang direpresentasikan sebuah geohash. */
export function decodeGeohashBounds(hash: string): GeohashBounds {
  if (!hash) throw new Error('geohash tidak boleh kosong');
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let evenBit = true;

  for (const char of hash.toLowerCase()) {
    const idx = BASE32.indexOf(char);
    if (idx < 0) throw new Error(`Karakter geohash tidak valid: ${char}`);
    for (let n = 4; n >= 0; n--) {
      const bitValue = (idx >> n) & 1;
      if (evenBit) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        lngRange = bitValue ? [mid, lngRange[1]] : [lngRange[0], mid];
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        latRange = bitValue ? [mid, latRange[1]] : [latRange[0], mid];
      }
      evenBit = !evenBit;
    }
  }
  return { latMin: latRange[0], latMax: latRange[1], lngMin: lngRange[0], lngMax: lngRange[1] };
}

export function decodeGeohashCenter(hash: string): LatLng {
  const b = decodeGeohashBounds(hash);
  return { lat: (b.latMin + b.latMax) / 2, lng: (b.lngMin + b.lngMax) / 2 };
}

type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** Geohash dari 8 sel tetangga (presisi sama) di sekitar sebuah geohash. */
export function geohashNeighbors(hash: string): Record<Direction, string> {
  const precision = hash.length;
  const b = decodeGeohashBounds(hash);
  const latStep = b.latMax - b.latMin;
  const lngStep = b.lngMax - b.lngMin;
  const clampLat = (v: number) => Math.min(90, Math.max(-90, v));
  const wrapLng = (v: number) => (((v + 180) % 360) + 360) % 360 - 180;
  const center = decodeGeohashCenter(hash);

  const at = (dLat: number, dLng: number) =>
    encodeGeohash({ lat: clampLat(center.lat + dLat * latStep), lng: wrapLng(center.lng + dLng * lngStep) }, precision);

  return {
    n: at(1, 0),
    ne: at(1, 1),
    e: at(0, 1),
    se: at(-1, 1),
    s: at(-1, 0),
    sw: at(-1, -1),
    w: at(0, -1),
    nw: at(1, -1),
  };
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Jarak great-circle antara dua titik (km), rumus Haversine. */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  assertValidLatLng(a);
  assertValidLatLng(b);
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Lebar kira-kira (km) satu sel geohash pada tiap presisi (1-9), dipakai memilih presisi query. */
const CELL_WIDTH_KM_BY_PRECISION: readonly number[] = [
  0, // indeks 0 tidak dipakai
  5000, 1250, 156, 39.1, 4.89, 1.22, 0.153, 0.0382, 0.00477,
];

/** Presisi geohash terkecil (sel terbesar) yang selnya masih >= radius pencarian. */
export function precisionForRadiusKm(radiusKm: number): number {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) throw new Error(`radiusKm harus > 0, diterima: ${radiusKm}`);
  for (let p = GEOHASH_STORAGE_PRECISION; p >= 1; p--) {
    if (CELL_WIDTH_KM_BY_PRECISION[p]! >= radiusKm) return p;
  }
  return 1;
}

export interface GeohashRange {
  /** Batas bawah query Firestore (`where(geohash, '>=', start)`). */
  start: string;
  /** Batas atas query Firestore (`where(geohash, '<', end)`) — mencakup semua hash berawalan `start`. */
  end: string;
}

/**
 * Rentang query yang mencakup pusat + 8 sel tetangga di sekitar `center` pada presisi
 * yang cocok untuk `radiusKm` (pola GeoFire). Karena bentuk sel geohash bujur sangkar
 * (bukan lingkaran), area yang dicakup rentang ini SELALU lebih luas dari radius — hasil
 * query WAJIB disaring ulang dengan `haversineDistanceKm` sebelum ditampilkan.
 */
export function geohashQueryBounds(center: LatLng, radiusKm: number): GeohashRange[] {
  const precision = precisionForRadiusKm(radiusKm);
  const centerHash = encodeGeohash(center, precision);
  const neighbors = geohashNeighbors(centerHash);
  const prefixes = new Set([centerHash, ...Object.values(neighbors)]);
  return [...prefixes].sort().map((prefix) => ({ start: prefix, end: prefix + '~' }));
}
