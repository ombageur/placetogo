import { describe, expect, it } from 'vitest';
import {
  decodeGeohashBounds,
  decodeGeohashCenter,
  encodeGeohash,
  geohashNeighbors,
  geohashQueryBounds,
  haversineDistanceKm,
  precisionForRadiusKm,
} from './geohash.js';

// Titik acuan nyata untuk uji properti (bukan mengandalkan string hash hafalan).
const MONAS = { lat: -6.1754, lng: 106.8272 }; // Jakarta
const BANDUNG = { lat: -6.9175, lng: 107.6191 };
const SYDNEY_OPERA = { lat: -33.8568, lng: 151.2153 };

describe('encodeGeohash', () => {
  it('deterministik: titik yang sama selalu menghasilkan hash yang sama', () => {
    expect(encodeGeohash(MONAS)).toBe(encodeGeohash(MONAS));
  });
  it('panjang hash sama dengan presisi yang diminta', () => {
    for (const p of [1, 5, 9, 12]) expect(encodeGeohash(MONAS, p)).toHaveLength(p);
  });
  it('presisi lebih tinggi adalah perluasan presisi rendah (prefix sama)', () => {
    const short = encodeGeohash(MONAS, 5);
    const long = encodeGeohash(MONAS, 9);
    expect(long.startsWith(short)).toBe(true);
  });
  it('titik yang jauh berbeda menghasilkan hash yang berbeda', () => {
    expect(encodeGeohash(MONAS)).not.toBe(encodeGeohash(SYDNEY_OPERA));
  });
  it('menolak koordinat di luar jangkauan', () => {
    expect(() => encodeGeohash({ lat: 91, lng: 0 })).toThrow();
    expect(() => encodeGeohash({ lat: 0, lng: 181 })).toThrow();
  });
});

describe('decodeGeohashBounds / decodeGeohashCenter', () => {
  it('kotak batas hasil decode selalu memuat titik asli', () => {
    for (const point of [MONAS, BANDUNG, SYDNEY_OPERA, { lat: 0, lng: 0 }, { lat: -89.9, lng: 179.9 }]) {
      const hash = encodeGeohash(point, 9);
      const b = decodeGeohashBounds(hash);
      expect(point.lat).toBeGreaterThanOrEqual(b.latMin);
      expect(point.lat).toBeLessThanOrEqual(b.latMax);
      expect(point.lng).toBeGreaterThanOrEqual(b.lngMin);
      expect(point.lng).toBeLessThanOrEqual(b.lngMax);
    }
  });
  it('titik pusat hasil decode dekat dengan titik asli (presisi tinggi)', () => {
    const hash = encodeGeohash(MONAS, 9);
    const center = decodeGeohashCenter(hash);
    expect(haversineDistanceKm(MONAS, center)).toBeLessThan(0.01); // < 10 m pada presisi 9
  });
});

describe('geohashNeighbors', () => {
  it('menghasilkan 8 arah, semuanya presisi sama dan berbeda dari pusat', () => {
    const hash = encodeGeohash(MONAS, 7);
    const n = geohashNeighbors(hash);
    const values = Object.values(n);
    expect(values).toHaveLength(8);
    for (const v of values) {
      expect(v).toHaveLength(7);
      expect(v).not.toBe(hash);
    }
  });
  it('tetangga secara geografis dekat dengan sel pusat', () => {
    const hash = encodeGeohash(MONAS, 6);
    const centerPoint = decodeGeohashCenter(hash);
    const n = geohashNeighbors(hash);
    // Lebar sel presisi 6 ~1.22 km; tetangga seharusnya dalam radius beberapa km.
    for (const dir of Object.values(n)) {
      const dist = haversineDistanceKm(centerPoint, decodeGeohashCenter(dir));
      expect(dist).toBeLessThan(5);
    }
  });
  it('bekerja di dekat kutub dan garis tanggal (tidak melempar)', () => {
    expect(() => geohashNeighbors(encodeGeohash({ lat: 89.9, lng: 179.9 }, 6))).not.toThrow();
    expect(() => geohashNeighbors(encodeGeohash({ lat: -89.9, lng: -179.9 }, 6))).not.toThrow();
  });
});

describe('haversineDistanceKm', () => {
  it('jarak titik ke dirinya sendiri adalah nol', () => {
    expect(haversineDistanceKm(MONAS, MONAS)).toBeCloseTo(0, 5);
  });
  it('Jakarta ke Bandung sekitar 110-130 km (jarak lurus)', () => {
    const d = haversineDistanceKm(MONAS, BANDUNG);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(140);
  });
  it('simetris: A ke B sama dengan B ke A', () => {
    expect(haversineDistanceKm(MONAS, BANDUNG)).toBeCloseTo(haversineDistanceKm(BANDUNG, MONAS), 9);
  });
});

describe('precisionForRadiusKm', () => {
  it('radius kecil -> presisi lebih tinggi (sel lebih kecil)', () => {
    expect(precisionForRadiusKm(0.5)).toBeGreaterThan(precisionForRadiusKm(50));
  });
  it('menolak radius <= 0', () => {
    expect(() => precisionForRadiusKm(0)).toThrow();
    expect(() => precisionForRadiusKm(-1)).toThrow();
  });
});

describe('geohashQueryBounds', () => {
  it('mengembalikan hingga 9 rentang unik (pusat + tetangga, bisa lebih sedikit karena duplikat)', () => {
    const bounds = geohashQueryBounds(MONAS, 5);
    expect(bounds.length).toBeGreaterThan(0);
    expect(bounds.length).toBeLessThanOrEqual(9);
    const starts = bounds.map((b) => b.start);
    expect(new Set(starts).size).toBe(starts.length); // tidak ada duplikat
  });
  it('setiap rentang: end = start + "~" (mencakup semua hash berawalan start)', () => {
    for (const b of geohashQueryBounds(MONAS, 10)) {
      expect(b.end).toBe(`${b.start}~`);
      expect(b.start < b.end).toBe(true);
    }
  });
  it('geohash lokasi yang dicari sendiri selalu ikut tercakup salah satu rentang', () => {
    const bounds = geohashQueryBounds(BANDUNG, 3);
    const precision = bounds[0]!.start.length;
    const ownPrefix = encodeGeohash(BANDUNG, precision);
    expect(bounds.some((b) => b.start === ownPrefix)).toBe(true);
  });
});
