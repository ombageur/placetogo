import { z } from 'zod';
import { emptyToUndefined } from '@placetogo/shared';

/**
 * Hanya variabel NEXT_PUBLIC_* yang boleh ada di sini: nilainya masuk ke bundle browser.
 * Secret server (kunci Maps server, DOKU) TIDAK BOLEH pernah dirujuk dari kode web.
 * Next.js hanya meng-inline NEXT_PUBLIC_* yang dirujuk secara statis, jadi objeknya ditulis eksplisit.
 */
const schema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'production']).default('development'),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEXT_PUBLIC_USE_EMULATORS: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:8081'),
  /** Tombol Google hanya tampil bila provider sudah dikonfigurasi di Firebase Console. */
  NEXT_PUBLIC_AUTH_GOOGLE_ENABLED: z.enum(['true', 'false']).default('false'),
  /**
   * Kunci BROWSER Maps JavaScript API (dibatasi HTTP referrer di Google Cloud Console) —
   * hanya untuk memuat peta interaktif, TIDAK dipakai untuk panggilan Places (itu lewat
   * backend dengan kunci server terpisah, lihat services/api). Opsional: peta gagal-anggun
   * ke pesan "peta tidak tersedia" bila kosong, bukan melempar galat.
   */
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type PublicEnv = z.infer<typeof schema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Konfigurasi publik tidak valid: ${issues}`);
  }
  const env = result.data;
  if (env.NEXT_PUBLIC_APP_ENV === 'production' && env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    throw new Error('Emulator tidak boleh aktif di production');
  }
  return env;
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_USE_EMULATORS: process.env.NEXT_PUBLIC_USE_EMULATORS,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_AUTH_GOOGLE_ENABLED: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED,
    NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY,
  });
}
