import { z } from 'zod';
import { emptyToUndefined } from '../lib/optional-text.js';

/** Skema input check-in di venue pertemuan */
export const checkinInputSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
export type CheckinInput = z.infer<typeof checkinInputSchema>;

/** Skema data check-in yang tersimpan */
export const checkinResultSchema = z.object({
  uid: z.string().min(1),
  activityId: z.string().min(1),
  checkedInAt: z.number().int().positive(),
  verifiedLocation: z.boolean(),
  rewardClaimed: z.boolean(),
  rewardAmount: z.number().int().nonnegative(),
});
export type CheckinResult = z.infer<typeof checkinResultSchema>;

export const APPRECIATION_PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000, 250000] as const;

/** Skema input kirim apresiasi pasca-pertemuan */
/**
 * Apresiasi bisa dikirim setelah bertemu di sebuah ajakan, atau sebagai dukungan lepas
 * tanpa aktivitas apa pun. Karena itu `activityId` opsional; bila ada, apresiasinya
 * tertaut ke pertemuan tersebut.
 */
export const sendAppreciationInputSchema = z.object({
  activityId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  toUid: z.string().min(1),
  amount: z.number().int().min(5000).max(1000000),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
});
export type SendAppreciationInput = z.infer<typeof sendAppreciationInputSchema>;

/** Skema dokumen di koleksi appreciations/{id} */
export const appreciationDocSchema = z.object({
  id: z.string().min(1),
  fromUid: z.string().min(1),
  toUid: z.string().min(1),
  activityId: z.string().min(1).optional(),
  amount: z.number().int().positive(),
  note: z.string().optional(),
  createdAt: z.number().int().positive(),
});
export type AppreciationDoc = z.infer<typeof appreciationDocSchema>;

/**
 * Ringkasan aktivitas seorang pengguna untuk ditampilkan di halaman profil.
 * Seluruh angkanya dihitung dari data, bukan nilai contoh.
 */
export const profileStatsSchema = z.object({
  /** Jumlah pertemuan yang kehadirannya sudah terverifikasi lewat check-in. */
  meetings: z.number().int().min(0),
  /** Jumlah ajakan yang dibuat pengguna ini. */
  activities: z.number().int().min(0),
  /** Jumlah hadiah/apresiasi yang diterima, beserta total koinnya. */
  giftsReceived: z.number().int().min(0),
  giftCoins: z.number().int().min(0),
});
export type ProfileStats = z.infer<typeof profileStatsSchema>;
