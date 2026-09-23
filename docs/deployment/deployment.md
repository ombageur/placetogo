# Deployment (Fase 00)

**Belum ada yang dideploy.** Semua langkah cloud menunggu persetujuan project ID, billing, region, dan
domain (Lampiran D). Sampai itu, semua pengembangan memakai Emulator dengan project `demo-placetogo`.

## Lokal
```bash
pnpm install
cp .env.example apps/web/.env.local   # sisakan bagian WEB
cp .env.example services/api/.env     # sisakan bagian API; dimuat otomatis oleh `pnpm dev:api`
pnpm emulators          # Auth 9099, Firestore 8080, Storage 9199, UI 4000
pnpm dev:api            # http://localhost:8081
pnpm dev:web            # http://localhost:3000
```
Catatan: `.env.example` memakai port API 8081 karena 8080 dipakai emulator Firestore.

## Dua lingkungan
| | development | production |
|---|---|---|
| Firebase project | `REPLACE_WITH_DEV_PROJECT_ID` (`.firebaserc` alias `development`) | `REPLACE_WITH_PROD_PROJECT_ID` (alias `production`) |
| `APP_ENV` | `development` | `production` (menolak emulator, `demo-*`, DOKU production) |
| DOKU | sandbox | tidak aktif sampai persetujuan + audit |

## Langkah (setelah persetujuan)
1. Buat dua project Firebase/GCP, tautkan billing, tetapkan region Firestore (tidak bisa diubah setelah dibuat).
2. `firebase use development` lalu `firebase deploy --only firestore:rules,firestore:indexes,storage`.
3. Buat service account, secret, budget, alert: `infrastructure/scripts/setup-gcp.md`.
4. Backend: build image (`services/api/Dockerfile`, konteks root repo), push ke Artifact Registry,
   `gcloud run services replace infrastructure/cloud-run/service.yaml`.
5. Web: buat backend App Hosting dari repositori memakai `apps/web/apphosting.yaml`.

## Rollback
- Rules/indeks: deploy ulang commit sebelumnya.
- Cloud Run: arahkan trafik ke revisi sebelumnya (`gcloud run services update-traffic`).
- App Hosting: rollback ke rilis sebelumnya dari konsol/CLI.
