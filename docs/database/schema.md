# Skema Firestore dan indeks (Fase 00)

Nama koleksi didefinisikan sekali di `packages/shared/src/constants/collections.ts`.
Akses: **C** = klien, **B** = backend (Admin SDK, melewati Rules, wajib otorisasi sendiri).

| Koleksi / path | Isi | Baca | Tulis |
|---|---|---|---|
| `users/{uid}` | displayName, avatarId, bio?, cityId? (hilang bila cityVisible=false), interests, createdAt, updatedAt | C: pengguna masuk | B saja (`PUT /v1/me/profile`, sejak Fase 03) |
| `user_private/{uid}` | schemaVersion, profileComplete, cityId (kanonik), cityVisible, createdAt, updatedAt (tanpa email/sandi) | C: pemilik | B saja (`POST /v1/me/init`, `PUT /v1/me/profile`) |
| `activities/{id}` | creatorId, title, titleLower, description?, categoryId, cityId, venueName, placeId?, lat?/lng?/geohash? (Fase 05: diisi bersamaan atau tidak sama sekali), startsAt, capacity, participantCount, paymentType, status, createdAt, updatedAt? | C: query list WAJIB filter `status in [published,full]` (lihat docs/discovery); draft hanya pembuat | B saja — baca lewat Firestore langsung (client SDK); tulis tetap menunggu Fase 06 (seed dev pakai Admin SDK) |
| `activities/{id}/participants/{uid}` | status, joinedAt | C: pemilik / pembuat ajakan | B saja (transaksi) |
| `activities/{id}/join_requests/{uid}` | status, createdAt, reviewedAt; ID = uid (deterministik) | C: pemilik / pembuat ajakan | B saja |
| `conversations/{id}` | memberIds, lastMessageAt, ringkasan | C: anggota | B saja (Fase 07 membuka tulis pesan) |
| `conversations/{id}/messages/{id}` | senderId, body, createdAt | C: anggota | B saja (Fase 07) |
| `wallets/{uid}` | balance, version, updatedAt | C: pemilik | B saja |
| `wallet_ledger/{id}` | uid, delta, referenceId, type, createdAt (immutable) | tidak ada | B saja |
| `payments/{id}` | orderId, uid, amount, currency, status gateway, timestamps | tidak ada | B saja |
| `webhook_events/{id}` | idempotensi notifikasi DOKU (Fase 09) | tidak ada | B saja |
| `appreciations/{id}` | fromUid, toUid, giftId, activityId, createdAt | C: pengirim/penerima | B saja |
| `reports/{id}` | reporterId, subject, category, status | tidak ada | B saja (moderator lewat API) |
| `notifications/{id}` | uid, jenis, createdAt, readAt | C: pemilik | B saja |

Semua path lain: ditolak (`match /{document=**}`), termasuk Storage.

## Indeks komposit minimum (`firebase/firestore.indexes.json`)

| Koleksi | Field | Untuk |
|---|---|---|
| activities | status, startsAt | daftar terbaru/mendatang |
| activities | status, cityId, startsAt | filter kota |
| activities | status, categoryId, startsAt | filter kategori |
| activities | status, cityId, categoryId, startsAt | kota + kategori |
| activities | creatorId, createdAt desc | ajakan milik saya |
| conversations | memberIds (array-contains), lastMessageAt desc | inbox |
| wallet_ledger | uid, createdAt desc | riwayat Coin (via API) |
| payments | uid, createdAt desc | riwayat top up (via API) |
| reports | status, createdAt desc | antrean moderasi (via API) |
| notifications | uid, createdAt desc | daftar notifikasi |

Indeks satu-field dibuat otomatis oleh Firestore. Fase 04 menambah `status+createdAt desc`
(tab Terbaru) dan `status+titleLower` (pencarian awalan judul); Fase 05 menambah
`status+geohash` (tab Terdekat) — detail lengkap query dan alasan tiap indeks ada di
docs/discovery/discovery.md dan docs/discovery/nearby.md. `startsAt` disimpan sebagai epoch ms.

## Migrasi dan rollback

Fase 00 belum punya data. Aturan dan indeks bersifat deklaratif: rollback = deploy ulang versi
sebelumnya dari repositori. Penghapusan indeks dan perubahan bentuk dokumen di fase berikutnya
harus melalui migrasi dua tahap (tambah, backfill, lalu hapus).
