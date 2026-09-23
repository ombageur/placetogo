import { z } from 'zod';
import { AVATAR_IDS, CITY_IDS, INTEREST_IDS } from '../constants/catalog.js';
import { emptyToUndefined } from '../lib/optional-text.js';

const NO_NEWLINE = /^[^\n\r]+$/;

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Nama panggilan minimal 2 karakter.')
  .max(40, 'Nama panggilan maksimal 40 karakter.')
  .regex(NO_NEWLINE, 'Nama panggilan tidak boleh berisi baris baru.');

export const bioSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(100, 'Bio maksimal 100 karakter.')
    .regex(NO_NEWLINE, 'Bio tidak boleh berisi baris baru.')
    .optional(),
);

const LEGACY_INTEREST_MAP: Record<string, string> = {
  ngopi: 'kuliner',
  makan: 'kuliner',
  nonton: 'film',
  'jalan-jalan': 'komunitas',
  musik: 'seni',
  fotografi: 'video',
  game: 'ngobrol',
  alam: 'komunitas',
};

export const normalizeInterests = (val: unknown): unknown => {
  if (!Array.isArray(val)) return val;
  return val.map((item) => (typeof item === 'string' && LEGACY_INTEREST_MAP[item] ? LEGACY_INTEREST_MAP[item] : item));
};

export const avatarIdSchema = z.enum(AVATAR_IDS, { message: 'Pilih salah satu avatar.' });
export const cityIdSchema = z.enum(CITY_IDS, { message: 'Pilih kota dari daftar.' });
export const interestIdSchema = z.enum(INTEREST_IDS);

export const interestsSchema = z.preprocess(
  normalizeInterests,
  z
    .array(interestIdSchema)
    .min(1, 'Pilih minimal 1 minat.')
    .max(8, 'Pilih maksimal 8 minat.')
    .refine((arr) => new Set(arr).size === arr.length, 'Minat tidak boleh duplikat.'),
);

/** Body PUT /v1/me/profile, juga dipakai untuk validasi form di klien. */
export const profileInputSchema = z.object({
  displayName: displayNameSchema,
  avatarId: avatarIdSchema,
  bio: bioSchema,
  cityId: cityIdSchema,
  /** Preferensi privasi: bila false, cityId disembunyikan dari profil publik. */
  cityVisible: z.boolean(),
  interests: interestsSchema,
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

/** Field publik users/{uid}. cityId opsional: dihilangkan bila cityVisible=false. */
export const publicUserSchema = z.object({
  displayName: displayNameSchema,
  avatarId: avatarIdSchema,
  bio: bioSchema,
  cityId: cityIdSchema.optional(),
  interests: interestsSchema,
});
export type PublicUser = z.infer<typeof publicUserSchema>;

/** Respons GET/PUT /v1/me/profile: gabungan data publik + privat milik sendiri. */
export const myProfileSchema = z.object({
  displayName: displayNameSchema,
  avatarId: avatarIdSchema,
  bio: bioSchema,
  cityId: cityIdSchema,
  cityVisible: z.boolean(),
  interests: interestsSchema,
});
export type MyProfile = z.infer<typeof myProfileSchema>;
