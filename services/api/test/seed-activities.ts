import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS, encodeGeohash, type Activity } from '@placetogo/shared';

/**
 * Data ajakan contoh untuk Fase 04/05 (Discovery, Terdekat). Ditulis langsung lewat Admin
 * SDK karena alur "Buat Ajakan" sungguhan baru dibangun di Fase 06; skema aktivitas sudah
 * final (Lampiran A + Fase 05) sehingga aman dipakai lebih dulu di sini.
 *
 * `titleLower` dan `geohash` dihitung otomatis dari `title`/`lat`/`lng` — di Fase 06 ini
 * akan dihitung backend saat membuat ajakan, sama seperti pola field turunan lain di
 * aplikasi ini. Koordinat memakai lokasi nyata (area publik di kota masing-masing) agar
 * jarak yang dihitung `haversineDistanceKm` realistis untuk uji "Terdekat".
 */
export interface SeedActivityInput
  extends Omit<Activity, 'titleLower' | 'createdAt' | 'updatedAt' | 'startsAt' | 'geohash'> {
  /** Menit relatif terhadap Date.now() saat seeding; negatif = di masa lalu (kedaluwarsa). */
  startsInMinutes: number;
  lat: number;
  lng: number;
}

export function buildSeedActivities(creatorId: string): SeedActivityInput[] {
  const hours = (h: number) => h * 60;
  return [
    {
      creatorId,
      title: 'Ngobrol santai sore di Tuku',
      description: 'Ngobrol santai sambil ngopi. Semua topik oke, yang penting nyaman.',
      categoryId: 'ngobrol',
      cityId: 'jakarta',
      venueName: 'Tuku, Menteng',
      lat: -6.1954,
      lng: 106.8362,
      capacity: 4,
      participantCount: 1,
      paymentType: 'split',
      status: 'published',
      startsInMinutes: hours(20),
    },
    {
      creatorId,
      title: 'Karier & kerja produktif bareng',
      description: 'Kerja bareng sambil diskusi karier, cocok buat yang WFA.',
      categoryId: 'karier',
      cityId: 'bandung',
      venueName: 'Filosofi Kopi, Dago',
      lat: -6.8951,
      lng: 107.6134,
      capacity: 6,
      participantCount: 6,
      paymentType: 'split',
      status: 'full',
      startsInMinutes: hours(6),
    },
    {
      creatorId,
      title: 'Makan ramen & kuliner bareng',
      description: 'Cari teman makan ramen, sekalian icip menu baru.',
      categoryId: 'kuliner',
      cityId: 'jakarta',
      venueName: 'Ramen Nagi, PIM 3',
      lat: -6.2661,
      lng: 106.7838,
      capacity: 4,
      participantCount: 2,
      paymentType: 'treat',
      status: 'published',
      startsInMinutes: hours(48),
    },
    {
      creatorId,
      title: 'Nonton film indie',
      description: 'Nonton bareng di bioskop kecil, lanjut diskusi santai.',
      categoryId: 'film',
      cityId: 'yogyakarta',
      venueName: 'Empire XXI',
      lat: -7.7828,
      lng: 110.3872,
      capacity: 3,
      participantCount: 1,
      paymentType: 'treat',
      status: 'published',
      startsInMinutes: hours(72),
    },
    {
      creatorId,
      title: 'Jalan santai & cari teman di GBK',
      description: 'Jalan santai keliling GBK, cocok buat cari teman baru.',
      categoryId: 'pertemanan',
      cityId: 'jakarta',
      venueName: 'GBK Senayan',
      lat: -6.2188,
      lng: 106.8022,
      capacity: 5,
      participantCount: 1,
      paymentType: 'split',
      status: 'published',
      startsInMinutes: hours(16),
    },
    {
      creatorId,
      title: 'Diskusi buku bulan ini',
      description: 'Bahas buku non-fiksi pilihan bulan ini sambil ngemil.',
      categoryId: 'buku',
      cityId: 'surabaya',
      venueName: 'Perpustakaan Kota',
      lat: -7.2575,
      lng: 112.7521,
      capacity: 8,
      participantCount: 3,
      paymentType: 'split',
      status: 'published',
      startsInMinutes: hours(96),
    },
    {
      creatorId,
      title: 'Main badminton santai',
      description: 'Olahraga ringan, level pemula welcome.',
      categoryId: 'olahraga',
      cityId: 'jakarta',
      venueName: 'GOR Senen',
      lat: -6.1751,
      lng: 106.8419,
      capacity: 4,
      participantCount: 2,
      paymentType: 'split',
      status: 'published',
      startsInMinutes: hours(30),
    },
    {
      creatorId,
      title: 'Kumpul komunitas & board game',
      description: 'Main game bareng teman komunitas, banyak pilihan permainan.',
      categoryId: 'komunitas',
      cityId: 'bandung',
      venueName: 'Board Game Cafe Dago',
      lat: -6.899,
      lng: 107.614,
      capacity: 6,
      participantCount: 4,
      paymentType: 'gift',
      status: 'published',
      startsInMinutes: hours(120),
    },
    // Kedaluwarsa: HARUS tidak pernah muncul di Discovery walau statusnya published.
    {
      creatorId,
      title: 'Ngobrol kemarin (sudah lewat)',
      categoryId: 'ngobrol',
      cityId: 'jakarta',
      venueName: 'Tuku, Menteng',
      lat: -6.1954,
      lng: 106.8362,
      capacity: 4,
      participantCount: 1,
      paymentType: 'split',
      status: 'published',
      startsInMinutes: -hours(24),
    },
    // Draft: HARUS tidak pernah muncul di Discovery (hanya pembuat yang boleh melihat).
    {
      creatorId,
      title: 'Rencana workshop seni gerabah (draft)',
      categoryId: 'seni',
      cityId: 'jakarta',
      venueName: 'Studio Keramik',
      lat: -6.2,
      lng: 106.8,
      capacity: 5,
      participantCount: 0,
      paymentType: 'split',
      status: 'draft',
      startsInMinutes: hours(200),
    },
  ];
}

/** Menulis ajakan contoh ke Firestore (Admin SDK, melewati Rules). Mengembalikan id yang dibuat. */
export async function seedActivities(db: Firestore, creatorId: string, now = Date.now()): Promise<string[]> {
  const batch = db.batch();
  const ids: string[] = [];
  for (const input of buildSeedActivities(creatorId)) {
    const { startsInMinutes, lat, lng, ...rest } = input;
    const ref = db.collection(COLLECTIONS.activities).doc();
    batch.set(ref, {
      ...rest,
      lat,
      lng,
      geohash: encodeGeohash({ lat, lng }),
      titleLower: rest.title.toLowerCase(),
      startsAt: now + startsInMinutes * 60_000,
      createdAt: FieldValue.serverTimestamp(),
    });
    ids.push(ref.id);
  }
  await batch.commit();
  return ids;
}
