# placetogo.id

Platform teman aktivitas berbasis avatar. Monorepo pnpm: Next.js (web), Fastify (API), Firebase
(Auth, Firestore, Storage), Google Maps Platform, DOKU (pembayaran).

Status: **Fase 10 (Notifikasi, Pelaporan & Moderasi Komunitas) — selesai**. Lihat blueprint fase 00–11 dan `docs/`.

## Prasyarat
Node ≥ 22, pnpm 10, Java ≥ 21 (Firebase Emulator), firebase-tools (terpasang sebagai devDependency).
Docker opsional (hanya untuk membangun image API).

## Perintah
```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test            # unit + Security Rules (emulator)
pnpm smoke:api       # API hasil build vs emulator
pnpm test:integration  # API vs Auth/Firestore Emulator
pnpm test:e2e        # Playwright vs emulator (butuh `pnpm exec playwright install chromium`)
pnpm emulators       # Emulator Suite (project demo-placetogo)
```

## Data contoh untuk pengembangan lokal
Setelah `pnpm emulators` aktif (project `demo-placetogo`), isi akun dan ajakan contoh:
```bash
cd services/api
node scripts/seed-demo-users.mjs               # demo@placetogo.test / admin@placetogo.test
pnpm exec tsx scripts/seed-demo-activities.ts   # 8 ajakan contoh milik demo@placetogo.test
```
Hanya untuk emulator lokal — data hilang saat emulator direstart dan tidak pernah dipakai di production.

## Dokumentasi
- [Arsitektur](docs/architecture/architecture.md) · [Skema & indeks](docs/database/schema.md)
- [Keamanan](docs/security/security.md) · [Biaya](docs/cost/cost.md)
- [Deployment](docs/deployment/deployment.md) · [API](docs/api/api.md) · [Sistem desain](docs/design/design-system.md) · [Autentikasi](docs/auth/auth.md) · [Profil](docs/profile/profile.md) · [Discovery](docs/discovery/discovery.md) · [Maps & Lokasi](docs/discovery/nearby.md) · [Partisipasi & Ajakan](docs/participation/participation.md) · [Chat & Diskusi](docs/chat/chat.md) · [Meeting & Apresiasi](docs/meeting/meeting-confirmation.md) · [Dompet & Pembayaran](docs/wallet/coin-economy.md) · [Notifikasi & Moderasi](docs/moderation/safety-notifications.md)

Jangan pernah commit kredensial asli. Gunakan `.env.example` sebagai acuan dan Secret Manager di cloud.
