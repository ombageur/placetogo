import { z } from 'zod';

const optionalSecret = z
  .string()
  .min(1)
  .optional()
  .or(z.literal('').transform(() => undefined));

const schema = z
  .object({
    APP_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIRESTORE_EMULATOR_HOST: z.string().optional(),
    FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
    WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
    /** IP yang dikecualikan dari rate limit (hanya untuk uji lokal/E2E; dilarang di production). */
    RATE_LIMIT_ALLOWLIST: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(',').map((ip) => ip.trim()).filter(Boolean) : [])),
    // Kontrak eksternal: opsional di Fase 00, tidak ada panggilan berbayar.
    GOOGLE_MAPS_SERVER_API_KEY: optionalSecret,
    DOKU_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
    DOKU_CLIENT_ID: optionalSecret,
    DOKU_SECRET_KEY: optionalSecret,
  })
  .superRefine((env, ctx) => {
    if (env.APP_ENV !== 'production') return;
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) {
      fail('FIRESTORE_EMULATOR_HOST', 'Emulator tidak boleh aktif di production');
    }
    if (env.RATE_LIMIT_ALLOWLIST.length > 0) {
      fail('RATE_LIMIT_ALLOWLIST', 'Allowlist rate limit tidak boleh dipakai di production');
    }
    if (env.FIREBASE_PROJECT_ID.startsWith('demo-')) {
      fail('FIREBASE_PROJECT_ID', 'Project demo- tidak boleh dipakai di production');
    }
    if (env.DOKU_ENVIRONMENT === 'production') {
      fail('DOKU_ENVIRONMENT', 'DOKU production dilarang sebelum persetujuan dan audit (Fase 09/11)');
    }
  });

export type Env = z.infer<typeof schema>;

/** Gagal cepat dengan pesan yang tidak membocorkan nilai variabel. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Konfigurasi environment tidak valid: ${issues}`);
  }
  return result.data;
}
