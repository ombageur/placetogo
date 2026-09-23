import { defineConfig } from 'vitest/config';

// Uji unit saja; uji integrasi (emulator) memakai vitest.integration.config.ts.
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
