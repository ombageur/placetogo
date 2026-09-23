import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import {
  DISCOVERY_STATUSES,
  PAGINATION,
  activityDocSchema,
  geohashQueryBounds,
  haversineDistanceKm,
  type ActivityCategoryId,
  type ActivityDoc,
  type CityId,
  type LatLng,
} from '@placetogo/shared';
import { getFirebase } from '@/lib/firebase';

const COLLECTION_NAME = 'activities';

/** Cursor buram untuk UI: sebenarnya QueryDocumentSnapshot yang dibutuhkan `startAfter`. */
export type DiscoveryCursor = QueryDocumentSnapshot<DocumentData>;

export interface DiscoveryPage {
  items: ActivityDoc[];
  /** null = tidak ada halaman berikutnya (heuristik: hasil terakhir < ukuran halaman). */
  cursor: DiscoveryCursor | null;
  /** Jumlah dokumen yang benar-benar dibaca dari Firestore pada panggilan ini (untuk pelaporan biaya/tes). */
  readCount: number;
}

function toMillis(value: unknown): number | undefined {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return undefined;
}

function toActivityDoc(id: string, data: DocumentData): ActivityDoc {
  return activityDocSchema.parse({
    ...data,
    id,
    startsAt: toMillis(data.startsAt),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  });
}

function pageSizeOf(requested?: number): number {
  return Math.min(Math.max(1, requested ?? PAGINATION.defaultSize), PAGINATION.maxSize);
}

async function runPage(constraints: QueryConstraint[], effectiveLimit: number): Promise<{ docs: QueryDocumentSnapshot<DocumentData>[]; hasMore: boolean }> {
  const { db } = getFirebase();
  const snap = await getDocs(query(collection(db, COLLECTION_NAME), ...constraints, limit(effectiveLimit)));
  return { docs: snap.docs, hasMore: snap.docs.length === effectiveLimit };
}

function toPage(docs: QueryDocumentSnapshot<DocumentData>[], hasMore: boolean, filterExpired: boolean): DiscoveryPage {
  const now = Date.now();
  let items = docs.map((d) => toActivityDoc(d.id, d.data()));
  if (filterExpired) items = items.filter((a) => a.startsAt > now);
  return {
    items,
    cursor: hasMore && docs.length > 0 ? docs[docs.length - 1]! : null,
    readCount: docs.length,
  };
}

export interface BrowseFilters {
  categoryId?: ActivityCategoryId;
  cityId?: CityId;
}

/**
 * Daftar utama Discovery ("Rekomendasi"): hanya ajakan aktif (`published`/`full`) yang
 * waktunya belum lewat, terurut dari yang paling cepat berlangsung. Filter kota/kategori
 * memakai indeks komposit (`firebase/firestore.indexes.json`). Query selalu menyertakan
 * `status in [...]` — dibutuhkan agar Firestore Security Rules dapat membuktikan query
 * list ini aman tanpa memindai (lihat docs/discovery/discovery.md).
 */
export async function fetchDiscoveryPage(
  filters: BrowseFilters,
  cursor: DiscoveryCursor | null,
  pageSize?: number,
): Promise<DiscoveryPage> {
  const effectiveLimit = pageSizeOf(pageSize);
  const constraints: QueryConstraint[] = [
    where('status', 'in', DISCOVERY_STATUSES),
    where('startsAt', '>', Date.now()),
  ];
  if (filters.cityId) constraints.push(where('cityId', '==', filters.cityId));
  if (filters.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));
  constraints.push(orderBy('startsAt', 'asc'));
  if (cursor) constraints.push(startAfter(cursor));

  const { docs, hasMore } = await runPage(constraints, effectiveLimit);
  return toPage(docs, hasMore, false); // startsAt>now sudah di query; tidak perlu saring lagi
}

/**
 * "Terbaru": ajakan yang paling baru dipublikasikan. Firestore hanya mengizinkan satu
 * field rentang (`>`,`<`,dst.) per query, dan field itu wajib jadi orderBy pertama — karena
 * di sini kita mengurutkan `createdAt`, filter "belum kedaluwarsa" (`startsAt>now`) TIDAK
 * bisa disertakan di query dan disaring di klien setelah data diterima. Konsekuensinya:
 * satu halaman bisa berisi lebih sedikit kartu dari `pageSize` bila beberapa hasil mentah
 * ternyata sudah lewat waktunya; dokumen yang tersaring tetap terhitung sebagai baca
 * (`readCount`), sesuai batas nyata Firestore — bukan disembunyikan.
 */
export async function fetchRecentPage(cursor: DiscoveryCursor | null, pageSize?: number): Promise<DiscoveryPage> {
  const effectiveLimit = pageSizeOf(pageSize);
  const constraints: QueryConstraint[] = [where('status', 'in', DISCOVERY_STATUSES), orderBy('createdAt', 'desc')];
  if (cursor) constraints.push(startAfter(cursor));

  const { docs, hasMore } = await runPage(constraints, effectiveLimit);
  return toPage(docs, hasMore, true);
}

/**
 * Pencarian awalan judul (prefix match pada `titleLower`) — BUKAN full-text search.
 * Firestore tidak punya full-text search bawaan; alternatif nyata (Algolia/Typesense/dll.)
 * di luar lingkup fase ini. Sama seperti "Terbaru", filter kedaluwarsa disaring di klien
 * karena field rentang query sudah dipakai oleh `titleLower`. Filter kota/kategori
 * dinonaktifkan saat mencari untuk menghindari kombinasi indeks komposit yang meledak
 * (lihat docs/discovery/discovery.md).
 */
export async function fetchSearchPage(searchText: string, cursor: DiscoveryCursor | null, pageSize?: number): Promise<DiscoveryPage> {
  const effectiveLimit = pageSizeOf(pageSize);
  const prefix = searchText.trim().toLowerCase();
  if (!prefix) return { items: [], cursor: null, readCount: 0 };

  const constraints: QueryConstraint[] = [
    where('status', 'in', DISCOVERY_STATUSES),
    where('titleLower', '>=', prefix),
    where('titleLower', '<', prefix + ''),
    orderBy('titleLower', 'asc'),
  ];
  if (cursor) constraints.push(startAfter(cursor));

  const { docs, hasMore } = await runPage(constraints, effectiveLimit);
  return toPage(docs, hasMore, true);
}

export type ActivityWithDistance = ActivityDoc & { distanceKm: number };

export interface NearbyPage {
  items: ActivityWithDistance[];
  readCount: number;
}

const DEFAULT_NEARBY_RADIUS_KM = 10;

/**
 * "Terdekat": ajakan dalam radius `radiusKm` dari `center`, terurut dari yang paling dekat.
 * Firestore tidak punya tipe geospasial asli, jadi query dipecah jadi beberapa rentang
 * geohash (pusat + 8 sel tetangga, lihat lib/geohash.ts). Karena bentuk sel geohash
 * bujur sangkar (bukan lingkaran), area yang tercakup rentang-rentang itu SELALU lebih
 * luas dari radius — hasil disaring ulang dengan jarak sungguhan (Haversine) sebelum
 * ditampilkan. Tidak seperti feed lain, ini SATU pengambilan tanpa cursor "muat lebih
 * banyak": memberi halaman lanjutan yang benar untuk beberapa query rentang tergabung +
 * terurut ulang jarak adalah masalah tersendiri yang lebih kompleks, di luar lingkup MVP
 * ini (lihat docs/discovery/nearby.md). Ajakan tanpa koordinat (lat/lng/geohash kosong)
 * otomatis tidak pernah muncul di sini.
 */
export async function fetchNearbyActivities(
  center: LatLng,
  radiusKm: number = DEFAULT_NEARBY_RADIUS_KM,
  resultLimit: number = PAGINATION.defaultSize,
): Promise<NearbyPage> {
  const { db } = getFirebase();
  const bounds = geohashQueryBounds(center, radiusKm);
  const perRangeLimit = pageSizeOf(resultLimit);

  const snapshots = await Promise.all(
    bounds.map(({ start, end }) =>
      getDocs(
        query(
          collection(db, COLLECTION_NAME),
          where('status', 'in', DISCOVERY_STATUSES),
          where('geohash', '>=', start),
          where('geohash', '<', end),
          limit(perRangeLimit),
        ),
      ),
    ),
  );

  const now = Date.now();
  const byId = new Map<string, ActivityWithDistance>(); // dedup: sel tetangga bisa tumpang tindih
  let readCount = 0;
  for (const snap of snapshots) {
    readCount += snap.docs.length;
    for (const d of snap.docs) {
      if (byId.has(d.id)) continue;
      const activity = toActivityDoc(d.id, d.data());
      if (activity.startsAt <= now) continue; // kedaluwarsa
      if (activity.lat === undefined || activity.lng === undefined) continue; // tanpa koordinat
      const distanceKm = haversineDistanceKm(center, { lat: activity.lat, lng: activity.lng });
      if (distanceKm > radiusKm) continue; // di luar kotak sel tapi masih terbaca -> saring
      byId.set(d.id, { ...activity, distanceKm });
    }
  }

  const items = [...byId.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, perRangeLimit);
  return { items, readCount };
}

/** Detail satu ajakan. null bila tidak ada ATAU tidak boleh dilihat (mis. draft milik orang lain). */
export async function fetchActivityById(id: string): Promise<ActivityDoc | null> {
  try {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return toActivityDoc(snap.id, snap.data());
  } catch {
    return null; // termasuk permission-denied dari Security Rules
  }
}
