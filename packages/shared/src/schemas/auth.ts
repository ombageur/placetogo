import { z } from 'zod';

/** Email dinormalisasi (trim + huruf kecil) sebelum divalidasi. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Format email tidak valid.').max(254, 'Email terlalu panjang.'));

/** Kebijakan kata sandi: 8-128 karakter, mengandung huruf dan angka. */
export const passwordSchema = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter.')
  .max(128, 'Kata sandi maksimal 128 karakter.')
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Kata sandi harus berisi huruf dan angka.');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Nama lengkap minimal 2 karakter.')
  .max(100, 'Nama terlalu panjang.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+62|62|0)8[0-9]{7,11}$/, 'Format nomor HP tidak valid (contoh: 081234567890).');

export const registerSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const otpVerificationSchema = z.object({
  code: z.string().length(6, 'Kode OTP harus 6 digit angka.').regex(/^\d{6}$/, 'Kode OTP harus berupa angka.'),
});
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;

/** Saat masuk, kebijakan kata sandi tidak diperiksa agar tidak membocorkan aturan/akun. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Kata sandi wajib diisi.').max(128, 'Kata sandi terlalu panjang.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const resetRequestSchema = z.object({ email: emailSchema });
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

/**
 * Tahap akun menentukan ke mana pengguna diarahkan.
 * verify_email -> profile_incomplete -> ready
 */
export const ACCOUNT_STAGES = ['verify_email', 'profile_incomplete', 'ready'] as const;
export type AccountStage = (typeof ACCOUNT_STAGES)[number];

export function resolveAccountStage(a: { emailVerified: boolean; profileComplete: boolean }): AccountStage {
  if (!a.emailVerified) return 'verify_email';
  if (!a.profileComplete) return 'profile_incomplete';
  return 'ready';
}

/** Dokumen user_private/{uid}. Hanya backend yang menulis; tidak menyimpan kata sandi atau email. */
export const userPrivateSchema = z.object({
  schemaVersion: z.literal(1),
  profileComplete: z.boolean(),
  fullName: fullNameSchema.optional(),
  phoneNumber: phoneSchema.optional(),
});
export type UserPrivate = z.infer<typeof userPrivateSchema>;

/** Respons GET /v1/me dan POST /v1/me/init. */
export const accountStateSchema = z.object({
  uid: z.string().min(1),
  emailVerified: z.boolean(),
  initialized: z.boolean(),
  profileComplete: z.boolean(),
  stage: z.enum(ACCOUNT_STAGES),
});
export type AccountState = z.infer<typeof accountStateSchema>;
