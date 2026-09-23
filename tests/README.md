# Tests

Tes unit/integrasi ditempatkan berdampingan dengan paket yang diuji agar bisa dijalankan per paket:

| Suite | Lokasi | Perintah |
|---|---|---|
| Unit shared | `packages/shared/src/**/*.test.ts` | `pnpm --filter @placetogo/shared test` |
| Unit + integrasi API | `services/api/src/**/*.test.ts` | `pnpm --filter @placetogo/api test` |
| Unit web (token, kontras, nav) | `apps/web/src/**/*.test.ts` | `pnpm --filter @placetogo/web test` |
| Integrasi API vs Auth+Firestore Emulator (token asli, termasuk profil) | `services/api/test/` | `pnpm test:integration` |
| Integrasi web: query Discovery + Terdekat (geohash) vs Firestore Emulator sungguhan | `apps/web/test/` | `pnpm test:integration` (dijalankan berantai setelah tes API) |
| E2E web vs emulator: alur auth + profil + Discovery + Terdekat + degradasi Maps, 4 lebar, a11y, keyboard, screenshot | `apps/web/e2e/` | `pnpm test:e2e` (membangun web + API sendiri) |
| Security Rules (emulator) | `firebase/tests/` | `pnpm test:rules` |
| Smoke API vs emulator | `infrastructure/scripts/smoke-api.mjs` | `pnpm smoke:api` |

Direktori `tests/{integration,security,e2e,load}` disiapkan untuk E2E dan load test lintas paket (Fase 11).
