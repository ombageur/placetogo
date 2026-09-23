# API backend (Fase 00)

Base URL lokal: `http://localhost:8081`.

| Metode | Path | Auth | Respons |
|---|---|---|---|
| GET | `/healthz` | tidak | 200 `{status:"ok", service, time}`. Liveness, tanpa dependensi. |
| GET | `/readyz` | tidak | 200 bila Firestore terjangkau (baca 1 dokumen, timeout 3 dtk); 503 `{status:"degraded", checks}` bila tidak. |
| GET | `/v1/me` | Bearer ID token | 200 `{uid, emailVerified, initialized, profileComplete, stage}`; tanpa efek samping; 401 seragam bila token kosong/palsu/kedaluwarsa/dicabut; 60/menit/IP. |
| POST | `/v1/me/init` | Bearer ID token | Idempoten: membuat `user_private/{uid}` awal, respons sama dengan `GET /v1/me`; 10/menit/IP. |
| GET | `/v1/verified/ping` | Bearer + email terverifikasi | 200 `{ok, uid}`; 403 `email_not_verified` bila belum. Kontrak untuk endpoint yang mewajibkan verifikasi. |
| GET | `/v1/me/profile` | Bearer ID token | 200 `MyProfile` (displayName, avatarId, bio?, cityId, cityVisible, interests); 404 `profile_not_found` bila belum pernah disimpan; 60/menit/IP. |
| PUT | `/v1/me/profile` | Bearer + email terverifikasi | Upsert atomik `users/{uid}` + `user_private/{uid}`; 200 `MyProfile`; 400 `validation_error` dengan `fields` per kolom; 403 bila email belum terverifikasi; 20/menit/IP. |
| GET | `/v1/admin/ping` | Bearer + claim `admin` | 200 `{ok:true}`; 401 tanpa token valid; 403 non-admin. |

`/v1/verified/ping` dan `/v1/admin/ping` hanyalah kontrak fondasi untuk membuktikan verifikasi token dan RBAC;
endpoint bisnis ditambahkan per fase.

## Kontrak eksternal (tanpa panggilan jaringan)
- `services/api/src/modules/maps/contract.ts`: antarmuka `PlacesGateway` (Fase 05).
- `services/api/src/modules/doku/contract.ts`: antarmuka `PaymentGateway` (Fase 09). Endpoint, signature,
  dan status **belum ditentukan** dan wajib diambil dari dokumentasi resmi DOKU terkini.

## Galat
`401 {error:"unauthenticated"}`, `403 {error:"forbidden"|"email_not_verified"}`, `404 {error:"not_found"}`, `429 {error:"too_many_requests"}`, `500 {error:"internal"}` (tanpa detail internal). Identitas selalu dari token, tidak pernah dari body/query.

## Discovery (Fase 04)
Tidak ada rute backend baru. Daftar dan detail ajakan dibaca langsung dari Firestore lewat Client SDK (`apps/web/src/lib/activities/read.ts`), tunduk pada Security Rules. Desain query dan batasannya: docs/discovery/discovery.md.

## Places (Fase 05)
Proksi Places API (New) — kunci server tidak pernah ke klien. Lihat docs/discovery/nearby.md untuk kebijakan sesi, field mask, dan status pengujian (belum diuji terhadap Google sungguhan, menunggu kunci API).

| Metode | Path | Auth | Respons |
|---|---|---|---|
| GET | `/v1/places/autocomplete?input=&sessionToken=` | Bearer ID token | 200 `PlaceSuggestion[]`; 400 bila `input`/`sessionToken` tidak valid; 502 `places_unavailable` bila gateway gagal/belum dikonfigurasi; 60/menit/IP. |
| GET | `/v1/places/:placeId?sessionToken=` | Bearer ID token | 200 `PlaceDetails`; 400/502 serupa; 30/menit/IP. |
