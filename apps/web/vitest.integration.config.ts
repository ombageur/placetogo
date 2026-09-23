import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Uji integrasi butuh Firebase Emulator: jalankan lewat `pnpm test:integration` (root).
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { include: ['test/**/*.integration.test.ts'], testTimeout: 20_000 },
});
