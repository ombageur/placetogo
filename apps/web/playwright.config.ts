import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 3100;
const API_PORT = 18081;

/** Viewport sesuai kriteria Fase 01: 375, 430, tablet, dan desktop. */
export const VIEWPORTS = {
  'mobile-375': { width: 375, height: 812 },
  'mobile-430': { width: 430, height: 932 },
  'tablet-768': { width: 768, height: 1024 },
  'desktop-1280': { width: 1280, height: 800 },
} as const;

export const AUTH_FILE = 'e2e/.auth/user.json';

/**
 * Semua uji berjalan terhadap Firebase Emulator (project demo-placetogo), tanpa layanan cloud.
 * Jalankan dari root: `pnpm test:e2e` (emulators:exec menyetel *_EMULATOR_HOST).
 * Web dibangun dengan konfigurasi emulator karena NEXT_PUBLIC_* di-inline saat build.
 */
const webEnv = {
  NEXT_PUBLIC_APP_ENV: 'development',
  NEXT_PUBLIC_USE_EMULATORS: 'true',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-placetogo.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-placetogo',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'demo-app-id',
  NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${API_PORT}`,
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${WEB_PORT}`, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm --filter @placetogo/api build && node dist/server.js',
      cwd: '../../services/api',
      url: `http://127.0.0.1:${API_PORT}/healthz`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...(process.env as Record<string, string>),
        PORT: String(API_PORT),
        APP_ENV: 'development',
        FIREBASE_PROJECT_ID: 'demo-placetogo',
        WEB_ORIGIN: `http://127.0.0.1:${WEB_PORT}`,
        LOG_LEVEL: 'warn',
        RATE_LIMIT_ALLOWLIST: '127.0.0.1,::1,::ffff:127.0.0.1',
      },
    },
    {
      command: `pnpm exec next build && pnpm exec next start -p ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { ...(process.env as Record<string, string>), ...webEnv },
    },
  ],
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    ...Object.entries(VIEWPORTS).map(([name, viewport]) => ({
      name,
      testMatch: /(routes|interaksi)\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport,
        hasTouch: viewport.width < 768,
        isMobile: false,
        storageState: AUTH_FILE,
      },
    })),
    {
      name: 'auth-flows',
      testMatch: /auth-flows\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS['mobile-430'], hasTouch: true },
    },
    {
      name: 'discovery',
      testMatch: /discovery\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS['mobile-430'], hasTouch: true },
    },
    {
      name: 'maps',
      testMatch: /maps\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS['mobile-430'], hasTouch: true, storageState: AUTH_FILE },
    },
  ],
});
