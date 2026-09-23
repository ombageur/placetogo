import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Tes E2E (Playwright) di folder e2e/ dijalankan terpisah lewat `pnpm test:e2e`.
// Alias @/* disamakan dengan tsconfig.json agar modul yang mengimpor lewat @/ (mis.
// lib/activities/read.ts -> @/lib/firebase) bisa diresolusi Vitest, bukan hanya Next.js.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { include: ['src/**/*.test.ts'] },
});
