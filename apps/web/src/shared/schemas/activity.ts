import { z } from 'zod';
import {
  ACTIVITY_CATEGORY_IDS,
  ACTIVITY_TRAIT_IDS,
  MAX_ACTIVITY_TRAITS,
  mapLegacyActivityCategoryId,
} from '../constants/activity-catalog';
import { CITY_IDS } from '../constants/catalog';
import { emptyToUndefined } from '../lib/optional-text';
import { GEOHASH_STORAGE_PRECISION } from '../lib/geohash';

export const ACTIVITY_STATUSES = [
  'draft',
  'published',
  'full',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export const activityStatusSchema = z.enum(ACTIVITY_STATUSES);

/** Status yang dianggap "aktif" dan boleh muncul di Discovery. Selebihnya disembunyikan. */
export const DISCOVERY_STATUSES = ['published', 'full'] as const;

export const PAYMENT_TYPES = ['split', 'treat', 'gift'] as const; // patungan, ditraktir, hadiah
export const paymentTypeSchema = z.enum(PAYMENT_TYPES);

/*
 * Id kategori lama dipindahkan ke penggantinya, tetapi nilai yang tidak dikenal tetap
 * ditolak. Memakai normalizeActivityCategoryId di sini akan membuat masukan apa pun —
 * termasuk salah ketik — diterima diam-diam sebagai kategori bawaan.
 */
/**
 * Sifat ajakan. Opsional dan boleh kosong; dibatasi jumlahnya supaya daftar di halaman
 * detail tetap terbaca sekilas, dan nilainya harus berasal dari katalog.
 */
export const activityTraitsSchema = z.array(z.enum(ACTIVITY_TRAIT_IDS)).max(MAX_ACTIVITY_TRAITS);

export const activityCategorySchema = z.preprocess(
  (val) => (typeof val === 'string' ? mapLegacyActivityCategoryId(val) : val),
  z.enum(ACTIVITY_CATEGORY_IDS),
);
export const activityCitySchema = z.enum(CITY_IDS);

/**
 * Dokumen activities/{id}. `startsAt`/`createdAt`/`updatedAt` direpresentasikan sebagai
 * epoch milliseconds (bukan Firestore Timestamp) agar skema ini tetap bebas dependensi
 * Firebase; lapisan web mengonversi Timestamp <-> number di titik baca (lihat
 * apps/web/src/lib/activities/read.ts).
 *
 * `venueName` adalah nama tempat berupa teks bebas sejak Discovery (Fase 04); Fase 05
 * menambah `placeId` (Google Place ID), `lat`/`lng`, dan `geohash` di sampingnya — bukan
 * menggantikannya, karena `venueName` tetap dipakai sebagai label tampilan yang cepat
 * dibaca tanpa panggilan Places. Ketiganya opsional (aktivitas lama tanpa lokasi presisi
 * tetap valid; sekadar tidak muncul di tab "Terdekat"). `geohash` disimpan pada presisi
 * tetap `GEOHASH_STORAGE_PRECISION` (lihat lib/geohash.ts) agar query rentang prefix bekerja.
 */
const activityObjectSchema = z.object({
  creatorId: z.string().min(1),
  title: z.string().trim().min(3).max(80),
  /** lowercase(title), untuk pencarian awalan (prefix) — lihat docs/discovery/discovery.md. */
  titleLower: z.string().min(3).max(80),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  categoryId: activityCategorySchema,
  cityId: activityCitySchema,
  venueName: z.string().trim().min(1).max(80),
  placeId: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  geohash: z.string().min(1).max(GEOHASH_STORAGE_PRECISION).optional(),
  startsAt: z.number().int().positive(),
  capacity: z.number().int().min(1).max(50),
  participantCount: z.number().int().min(0),
  paymentType: paymentTypeSchema,
  traits: activityTraitsSchema.optional(),
  status: activityStatusSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive().optional(),
});

/** lat/lng/geohash: diisi bersamaan, atau tidak sama sekali. */
function hasConsistentLocation(a: { lat?: number; lng?: number; geohash?: string }): boolean {
  return (a.lat === undefined) === (a.lng === undefined) && (a.lat === undefined) === (a.geohash === undefined);
}
const LOCATION_REFINEMENT = {
  message: 'lat, lng, dan geohash harus diisi bersamaan atau tidak sama sekali.',
  path: ['geohash'],
};

export const activitySchema = activityObjectSchema.refine(hasConsistentLocation, LOCATION_REFINEMENT);
export type Activity = z.infer<typeof activitySchema>;

export const activityDocSchema = activityObjectSchema
  .extend({ id: z.string().min(1) })
  .refine(hasConsistentLocation, LOCATION_REFINEMENT);
export type ActivityDoc = z.infer<typeof activityDocSchema>;

/**
 * Input "Buat Ajakan" (Fase 06). Dibuat sebagai `draft`, dipublikasikan lewat panggilan
 * terpisah (`POST /v1/activities/:id/publish`) — lihat docs/participation/participation.md.
 * `titleLower`/`geohash`/`creatorId`/`status`/`participantCount`/timestamp dihitung backend,
 * tidak diterima dari klien. `capacity` biaya pembuatan Coin BELUM diterapkan di sini
 * (dompet/ledger baru ada Fase 09) — field pembayaran hanya metadata cara peserta patungan.
 */
export const createActivityInputSchema = z
  .object({
    title: z.string().trim().min(3).max(80),
    description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
    categoryId: activityCategorySchema,
    cityId: activityCitySchema,
    venueName: z.string().trim().min(1).max(80),
    placeId: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    startsAt: z.number().int().positive(),
    capacity: z.number().int().min(1).max(50),
    paymentType: paymentTypeSchema,
    traits: activityTraitsSchema.optional(),
  })
  .refine((a) => (a.lat === undefined) === (a.lng === undefined), {
    message: 'lat dan lng harus diisi bersamaan atau tidak sama sekali.',
    path: ['lng'],
  })
  .refine((a) => a.startsAt > Date.now(), {
    message: 'Waktu ajakan harus di masa depan.',
    path: ['startsAt'],
  });
export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

/** `PATCH /v1/activities/:id` — hanya kapasitas untuk MVP Fase 06 (lihat task "perubahan kapasitas"). */
export const updateActivityCapacitySchema = z.object({
  capacity: z.number().int().min(1).max(50),
});
export type UpdateActivityCapacityInput = z.infer<typeof updateActivityCapacitySchema>;
