# Arsitektur (Fase 00)

```
Browser (Next.js PWA) ──Firebase SDK──> Auth / Firestore (dibatasi Security Rules)
        │
        └── HTTPS + ID token ──> Fastify API (Cloud Run) ──Admin SDK──> Firestore / Auth
                                        ├─ Maps (Places API New)   [Fase 05]
                                        └─ DOKU (sandbox dahulu)   [Fase 09]
```

- `apps/web`: Next.js App Router, TypeScript strict, Tailwind v4, komponen shadcn/ui (`components.json`
  sudah dikonfigurasi; komponen ditambahkan di Fase 01). Dihosting di Firebase App Hosting.
- `services/api`: Fastify 5, hanya untuk operasi yang butuh otoritas server (transaksi kapasitas, saldo,
  webhook). Klien membaca data publik langsung dari Firestore sesuai Rules.
- `packages/shared`: konstanta koleksi dan skema Zod dipakai bersama; dibangun ke `dist/` (ESM).
- `firebase/`: Rules, indeks, dan tes emulator. `infrastructure/`: konfigurasi Cloud Run, App Hosting,
  monitoring, skrip.

## Keputusan
| Keputusan | Alasan |
|---|---|
| TypeScript 6 (bukan 7) | typescript-eslint belum mendukung TS 7 |
| Project emulator `demo-placetogo` | awalan `demo-` mencegah akses tak sengaja ke resource nyata |
| Health `/healthz` terpisah dari `/readyz` | liveness tidak boleh gagal karena dependensi luar |
| Rules mengizinkan klien menulis hanya `users/{uid}` | data lain menyangkut kapasitas/uang, ditulis backend |
