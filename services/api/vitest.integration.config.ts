import { defineConfig } from 'vitest/config';

// Uji integrasi butuh Firebase Emulator: jalankan lewat `pnpm test:integration` di root.
export default defineConfig({
  test: { include: ['test/**/*.integration.test.ts'], testTimeout: 20_000, fileParallelism: false },
});
