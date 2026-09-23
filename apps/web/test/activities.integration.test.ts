/**
 * Uji integrasi Discovery: lapisan query Firestore (lib/activities/read.ts) dijalankan
 * lewat Firebase Client SDK sungguhan terhadap Firestore + Auth Emulator (bukan mock),
 * sehingga Security Rules ikut ditegakkan sama seperti di browser. Data contoh ditulis
 * lewat helper Admin SDK yang sama dipakai skrip seed dev (services/api/test/seed-activities).
 *
 * Jalankan lewat `pnpm test:integration` (root) — emulators:exec menyetel *_EMULATOR_HOST.
 */
process.env.NEXT_PUBLIC_APP_ENV = 'development';
process.env.NEXT_PUBLIC_USE_EMULATORS = 'true';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'demo-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-placetogo.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-placetogo';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'demo-app-id';

import { beforeAll, describe, expect, it } from 'vitest';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { FieldValue, getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { encodeGeohash, haversineDistanceKm } from '@placetogo/shared';
import { fetchActivityById, fetchDiscoveryPage, fetchNearbyActivities, fetchRecentPage, fetchSearchPage } from '../src/lib/activities/read';
import { getFirebase } from '../src/lib/firebase';
import { seedActivities } from '../../../services/api/test/seed-activities';

const CREATOR_ID = `disco-test-${Date.now()}`;
let seededIds: string[] = [];

// Titik acuan + dua ajakan tambahan pada jarak terkontrol untuk uji "Terdekat" yang presisi
// (tidak bergantung pada estimasi jarak dunia nyata data contoh utama).
const NEARBY_CENTER = { lat: -6.2, lng: 106.8 };
const NEAR_POINT = { lat: -6.22, lng: 106.8 }; // ~2.2 km ke selatan
const FAR_POINT = { lat: -6.7, lng: 106.8 }; // ~55.5 km ke selatan

beforeAll(async () => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Jalankan lewat `pnpm test:integration` agar emulator aktif.');
  }
  const adminApp = getAdminApps()[0] ?? initAdminApp({ projectId: 'demo-placetogo' });
  const db = getAdminFirestore(adminApp);
  seededIds = await seedActivities(db, CREATOR_ID);

  const now = Date.now();
  const extra = [
    { title: 'Ajakan dekat pusat uji', ...NEAR_POINT, withLocation: true },
    { title: 'Ajakan jauh dari pusat uji', ...FAR_POINT, withLocation: true },
    { title: 'Ajakan tanpa koordinat', lat: 0, lng: 0, withLocation: false },
  ];
  const batch = db.batch();
  for (const e of extra) {
    const ref = db.collection('activities').doc();
    batch.set(ref, {
      creatorId: CREATOR_ID,
      title: e.title,
      titleLower: e.title.toLowerCase(),
      categoryId: 'lainnya',
      cityId: 'jakarta',
      venueName: 'Lokasi uji',
      ...(e.withLocation ? { lat: e.lat, lng: e.lng, geohash: encodeGeohash({ lat: e.lat, lng: e.lng }) } : {}),
      capacity: 4,
      participantCount: 0,
      paymentType: 'split',
      status: 'published',
      startsAt: now + 24 * 3_600_000,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  // Masuk sebagai pengguna biasa lewat Client SDK (persis seperti browser); Security Rules ikut berlaku.
  const { auth } = getFirebase();
  await createUserWithEmailAndPassword(auth, `disco-${Date.now()}@example.test`, 'RahasiaSekali2026');
}, 20_000);

/** Hanya ambil hasil milik CREATOR_ID agar tidak terganggu data dari file tes lain dalam sesi emulator yang sama. */
const mine = <T extends { creatorId: string }>(items: T[]) => items.filter((a) => a.creatorId === CREATOR_ID);

describe('fetchDiscoveryPage (Rekomendasi/browse)', () => {
  it('hanya menampilkan status published/full, tidak draft atau kedaluwarsa', async () => {
    const page = await fetchDiscoveryPage({}, null, 20);
    const titles = mine(page.items).map((a) => a.title);
    expect(titles).toContain('Ngopi santai sore di Tuku');
    expect(titles).toContain('Ngopi pagi produktif'); // status 'full' tetap tampil
    expect(titles).not.toContain('Ngopi kemarin (sudah lewat)'); // kedaluwarsa
    expect(titles).not.toContain('Draft belum dipublikasikan'); // draft
    for (const a of mine(page.items)) {
      expect(['published', 'full']).toContain(a.status);
      expect(a.startsAt).toBeGreaterThan(Date.now());
    }
  });

  it('readCount sama dengan jumlah dokumen yang diterima (satu baca per dokumen)', async () => {
    const page = await fetchDiscoveryPage({}, null, 5);
    expect(page.readCount).toBe(page.items.length);
    expect(page.readCount).toBeLessThanOrEqual(5);
  });

  it('filter kota bekerja lewat indeks komposit', async () => {
    const page = await fetchDiscoveryPage({ cityId: 'bandung' }, null, 20);
    const mineBandung = mine(page.items);
    expect(mineBandung.length).toBeGreaterThan(0);
    for (const a of mineBandung) expect(a.cityId).toBe('bandung');
  });

  it('filter kategori bekerja lewat indeks komposit', async () => {
    const page = await fetchDiscoveryPage({ categoryId: 'buku' }, null, 20);
    const mineBooks = mine(page.items);
    expect(mineBooks.length).toBeGreaterThan(0);
    for (const a of mineBooks) expect(a.categoryId).toBe('buku');
  });

  it('pagination cursor tidak menduplikasi atau melompati hasil', async () => {
    const pageSize = 3;
    const seenIds = new Set<string>();
    let cursor: Awaited<ReturnType<typeof fetchDiscoveryPage>>['cursor'] = null;
    let guard = 0;
    do {
      const page = await fetchDiscoveryPage({}, cursor, pageSize);
      for (const item of page.items) {
        expect(seenIds.has(item.id)).toBe(false); // tidak ada duplikat lintas halaman
        seenIds.add(item.id);
      }
      cursor = page.cursor;
      guard++;
    } while (cursor && guard < 20);

    const full = await fetchDiscoveryPage({}, null, 20);
    for (const item of full.items) expect(seenIds.has(item.id)).toBe(true); // tidak ada yang terlewat
  });
});

describe('fetchRecentPage (Terbaru)', () => {
  it('terurut dari yang paling baru dan menyaring kedaluwarsa di klien', async () => {
    const page = await fetchRecentPage(null, 20);
    const mineRecent = mine(page.items);
    const titles = mineRecent.map((a) => a.title);
    expect(titles).not.toContain('Ngopi kemarin (sudah lewat)');
    expect(titles).not.toContain('Draft belum dipublikasikan');
    for (let i = 1; i < page.items.length; i++) {
      expect(page.items[i - 1]!.createdAt).toBeGreaterThanOrEqual(page.items[i]!.createdAt);
    }
  });
});

describe('fetchSearchPage (prefix titleLower)', () => {
  it('mencocokkan awalan judul (tidak peka huruf besar/kecil), menyaring kedaluwarsa', async () => {
    const page = await fetchSearchPage('Ngopi', null, 20);
    const mineFound = mine(page.items);
    const titles = mineFound.map((a) => a.title);
    expect(titles).toContain('Ngopi santai sore di Tuku');
    expect(titles).toContain('Ngopi pagi produktif');
    // "Ngopi kemarin (sudah lewat)" cocok awalan query TAPI disaring karena kedaluwarsa.
    expect(titles).not.toContain('Ngopi kemarin (sudah lewat)');
    expect(page.readCount).toBeGreaterThanOrEqual(page.items.length); // dibayar penuh walau sebagian disaring
  });

  it('tidak mencocokkan kata di tengah judul (hanya awalan, bukan full-text)', async () => {
    const page = await fetchSearchPage('santai', null, 20); // "Ngopi SANTAI sore" — "santai" bukan awalan
    expect(mine(page.items).map((a) => a.title)).not.toContain('Ngopi santai sore di Tuku');
  });

  it('teks kosong tidak melakukan pembacaan apa pun', async () => {
    const page = await fetchSearchPage('   ', null, 20);
    expect(page).toEqual({ items: [], cursor: null, readCount: 0 });
  });
});

describe('fetchActivityById', () => {
  it('mengembalikan ajakan published; null untuk draft milik pengguna lain', async () => {
    const admin = getAdminFirestore(getAdminApps()[0]!);
    const publishedDoc = (await admin.collection('activities').where('creatorId', '==', CREATOR_ID).where('status', '==', 'published').limit(1).get()).docs[0]!;
    const draftDoc = (await admin.collection('activities').where('creatorId', '==', CREATOR_ID).where('status', '==', 'draft').limit(1).get()).docs[0]!;

    const found = await fetchActivityById(publishedDoc.id);
    expect(found?.title).toBe(publishedDoc.data().title);

    const draft = await fetchActivityById(draftDoc.id);
    expect(draft).toBeNull(); // permission-denied (bukan pembuatnya) diperlakukan sebagai null

    const missing = await fetchActivityById('id-tidak-ada-sama-sekali');
    expect(missing).toBeNull();
  });
});

describe('fetchNearbyActivities (Terdekat)', () => {
  it('hanya ajakan dalam radius, terurut jarak, tanpa draft/kedaluwarsa/tanpa koordinat', async () => {
    const page = await fetchNearbyActivities(NEARBY_CENTER, 10, 20);
    const titles = mine(page.items).map((a) => a.title);

    expect(titles).toContain('Ajakan dekat pusat uji');
    expect(titles).not.toContain('Ajakan jauh dari pusat uji'); // ~55 km, di luar radius 10 km
    expect(titles).not.toContain('Ajakan tanpa koordinat'); // tidak punya lat/lng/geohash
    expect(titles).not.toContain('Ngopi kemarin (sudah lewat)'); // kedaluwarsa
    expect(titles).not.toContain('Draft belum dipublikasikan'); // draft
    // Kota jauh (Bandung/Yogyakarta/Surabaya) tidak ikut dalam radius 10 km dari Jakarta.
    expect(titles).not.toContain('Ngopi pagi produktif');
    expect(titles).not.toContain('Nonton film indie');

    for (const a of mine(page.items)) {
      expect(a.distanceKm).toBeLessThanOrEqual(10);
      // distanceKm dari fungsi sama dengan Haversine dihitung ulang independen di tes.
      expect(a.distanceKm).toBeCloseTo(haversineDistanceKm(NEARBY_CENTER, { lat: a.lat!, lng: a.lng! }), 6);
    }
    for (let i = 1; i < page.items.length; i++) {
      expect(page.items[i - 1]!.distanceKm).toBeLessThanOrEqual(page.items[i]!.distanceKm); // terurut menaik
    }
  });

  it('radius lebih besar mengikutsertakan ajakan yang tadinya di luar jangkauan', async () => {
    const page = await fetchNearbyActivities(NEARBY_CENTER, 100, 20);
    expect(mine(page.items).map((a) => a.title)).toContain('Ajakan jauh dari pusat uji');
  });

  it('readCount melaporkan dokumen yang benar-benar dibaca (>= jumlah yang lolos saring)', async () => {
    const page = await fetchNearbyActivities(NEARBY_CENTER, 10, 20);
    expect(page.readCount).toBeGreaterThanOrEqual(page.items.length);
  });
});

describe('tidak melakukan full scan', () => {
  it('data contoh berhasil dibuat, dan setiap panggilan membaca paling banyak sejumlah limit yang diminta', async () => {
    expect(seededIds.length).toBe(10); // kontrol sanity: seeding di beforeAll berhasil
    const page = await fetchDiscoveryPage({}, null, 20);
    expect(page.readCount).toBeLessThanOrEqual(20);
  });
});
