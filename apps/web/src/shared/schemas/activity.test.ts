import { describe, expect, it } from 'vitest';
import { ACTIVITY_CATEGORY_CATALOG } from '../constants/activity-catalog.js';
import { encodeGeohash } from '../lib/geohash.js';
import {
  DISCOVERY_STATUSES,
  activitySchema,
  createActivityInputSchema,
  updateActivityCapacitySchema,
} from './activity.js';

const valid = {
  creatorId: 'u1',
  title: 'Ngopi santai di Tuku',
  titleLower: 'ngopi santai di tuku',
  description: 'Ngobrol santai.',
  categoryId: 'ngobrol',
  cityId: 'jakarta',
  venueName: 'Tuku, Menteng',
  startsAt: Date.now() + 86_400_000,
  capacity: 4,
  participantCount: 1,
  paymentType: 'split',
  status: 'published',
  createdAt: Date.now(),
};

describe('katalog kategori', () => {
  it('cocok dengan 12 minat resmi', () => {
    expect(ACTIVITY_CATEGORY_CATALOG.map((c) => c.id)).toEqual([
      'ngobrol',
      'olahraga',
      'film',
      'seni',
      'karier',
      'komunitas',
      'pertemanan',
      'kuliner',
      'video',
      'buku',
      'relawan',
      'hewan',
    ]);
  });
});

describe('activitySchema', () => {
  it('menerima aktivitas valid dan menormalisasi kategori legacy', () => {
    expect(activitySchema.safeParse(valid).success).toBe(true);
    const parsedLegacy = activitySchema.parse({ ...valid, categoryId: 'jalan-jalan' });
    expect(parsedLegacy.categoryId).toBe('pertemanan');
  });

  it('memindahkan categoryId lama ke penggantinya', () => {
    // Dokumen lama menyimpan 'ngopi'/'nonton'; keduanya kini menjadi 'kuliner'/'film'.
    const migrated = activitySchema.safeParse({ ...valid, categoryId: 'ngopi' });
    expect(migrated.success).toBe(true);
    if (migrated.success) expect(migrated.data.categoryId).toBe('kuliner');

    const film = activitySchema.safeParse({ ...valid, categoryId: 'nonton' });
    expect(film.success).toBe(true);
    if (film.success) expect(film.data.categoryId).toBe('film');
  });

  it('menolak categoryId/cityId di luar katalog', () => {
    expect(activitySchema.safeParse({ ...valid, categoryId: 'ngawur' }).success).toBe(false);
    expect(activitySchema.safeParse({ ...valid, cityId: 'atlantis' }).success).toBe(false);
  });

  it('menolak status di luar daftar', () => {
    expect(activitySchema.safeParse({ ...valid, status: 'ngawur' }).success).toBe(false);
  });

  it('description kosong atau hanya spasi menjadi undefined', () => {
    expect(activitySchema.parse({ ...valid, description: '' }).description).toBeUndefined();
    expect(activitySchema.parse({ ...valid, description: '   ' }).description).toBeUndefined();
  });

  it('capacity dan participantCount harus bilangan bulat non-negatif', () => {
    expect(activitySchema.safeParse({ ...valid, capacity: 0 }).success).toBe(false);
    expect(activitySchema.safeParse({ ...valid, participantCount: -1 }).success).toBe(false);
  });

  it('venueName wajib diisi', () => {
    expect(activitySchema.safeParse({ ...valid, venueName: '' }).success).toBe(false);
  });

  it('lokasi (lat/lng/geohash) tanpa lokasi valid, lengkap valid, dan sebagian ditolak', () => {
    expect(activitySchema.safeParse(valid).success).toBe(true); // tanpa lokasi sama sekali
    const monas = { lat: -6.1754, lng: 106.8272 };
    expect(
      activitySchema.safeParse({ ...valid, ...monas, geohash: encodeGeohash(monas) }).success,
    ).toBe(true);
    expect(activitySchema.safeParse({ ...valid, lat: -6.1754 }).success).toBe(false); // lng/geohash hilang
    expect(activitySchema.safeParse({ ...valid, lat: -6.1754, lng: 106.8272 }).success).toBe(false); // geohash hilang
    expect(activitySchema.safeParse({ ...valid, lat: 91, lng: 106, geohash: 'x' }).success).toBe(false); // lat di luar jangkauan
  });
});

describe('DISCOVERY_STATUSES', () => {
  it('hanya published dan full; draft/in_progress/completed/cancelled tidak termasuk', () => {
    expect(DISCOVERY_STATUSES).toEqual(['published', 'full']);
    expect(DISCOVERY_STATUSES).not.toContain('draft');
    expect(DISCOVERY_STATUSES).not.toContain('cancelled');
  });
});

const validCreateInput = {
  title: 'Ngopi santai sore di Tuku',
  description: 'Ngobrol santai sambil ngopi.',
  categoryId: 'ngopi',
  cityId: 'jakarta',
  venueName: 'Tuku, Menteng',
  startsAt: Date.now() + 86_400_000,
  capacity: 4,
  paymentType: 'split',
} as const;

describe('createActivityInputSchema', () => {
  it('menerima sifat ajakan dari katalog, menolak yang asing atau berlebihan', () => {
    const ok = createActivityInputSchema.safeParse({
      ...validCreateInput,
      traits: ['ramah-introvert', 'suasana-santai'],
    });
    expect(ok.success).toBe(true);

    // Nilai di luar katalog tidak boleh lolos.
    expect(
      createActivityInputSchema.safeParse({ ...validCreateInput, traits: ['ngawur'] }).success,
    ).toBe(false);

    // Lebih dari batas juga ditolak, supaya daftarnya tetap terbaca sekilas.
    expect(
      createActivityInputSchema.safeParse({
        ...validCreateInput,
        traits: ['ramah-introvert', 'suasana-santai', 'obrolan-bebas', 'grup-kecil', 'tempat-publik'],
      }).success,
    ).toBe(false);

    // Boleh tidak diisi sama sekali.
    expect(createActivityInputSchema.safeParse({ ...validCreateInput }).success).toBe(true);
  });

  it('menerima input minimal valid (tanpa lokasi presisi)', () => {
    expect(createActivityInputSchema.safeParse(validCreateInput).success).toBe(true);
  });

  it('menerima lat/lng bersamaan, menolak salah satu saja', () => {
    expect(createActivityInputSchema.safeParse({ ...validCreateInput, lat: -6.2, lng: 106.8 }).success).toBe(true);
    expect(createActivityInputSchema.safeParse({ ...validCreateInput, lat: -6.2 }).success).toBe(false);
  });

  it('menolak waktu di masa lalu', () => {
    expect(createActivityInputSchema.safeParse({ ...validCreateInput, startsAt: Date.now() - 1000 }).success).toBe(false);
  });

  it('menolak judul terlalu pendek dan kapasitas di luar jangkauan', () => {
    expect(createActivityInputSchema.safeParse({ ...validCreateInput, title: 'ab' }).success).toBe(false);
    expect(createActivityInputSchema.safeParse({ ...validCreateInput, capacity: 0 }).success).toBe(false);
    expect(createActivityInputSchema.safeParse({ ...validCreateInput, capacity: 51 }).success).toBe(false);
  });

  it('field turunan (titleLower, geohash, status, creatorId) tidak diterima dari klien', () => {
    const parsed = createActivityInputSchema.parse({
      ...validCreateInput,
      titleLower: 'seharusnya diabaikan',
      status: 'published',
      creatorId: 'orang-lain',
    });
    expect(parsed).not.toHaveProperty('titleLower');
    expect(parsed).not.toHaveProperty('status');
    expect(parsed).not.toHaveProperty('creatorId');
  });
});

describe('updateActivityCapacitySchema', () => {
  it('menerima 1-50, menolak di luar itu', () => {
    expect(updateActivityCapacitySchema.safeParse({ capacity: 1 }).success).toBe(true);
    expect(updateActivityCapacitySchema.safeParse({ capacity: 50 }).success).toBe(true);
    expect(updateActivityCapacitySchema.safeParse({ capacity: 0 }).success).toBe(false);
    expect(updateActivityCapacitySchema.safeParse({ capacity: 51 }).success).toBe(false);
  });
});
