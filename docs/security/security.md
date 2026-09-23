# Keamanan (Fase 00)

## Prinsip
1. **Deny-by-default**: Firestore dan Storage menolak semua akses yang tidak disebut eksplisit.
2. **Admin SDK melewati Rules.** Backend wajib memeriksa autentikasi (`verifyIdToken`, `checkRevoked`),
   otorisasi (kepemilikan/peran), dan validasi input (Zod) di setiap handler. Rules bukan pengganti.
3. **Klien tidak pernah menulis** data finansial, kapasitas, status ajakan, atau peran admin.
4. **Least privilege**: service account backend hanya diberi peran yang dibutuhkan (lihat
   `infrastructure/scripts/setup-gcp.md`); secret diberi akses per secret.
5. **Tidak ada secret di repo, log, atau bundle frontend.** Log Fastify menyunting `authorization`/`cookie`;
   kode web hanya membaca `NEXT_PUBLIC_*`.

## Kontrol yang sudah ada
- `firebase/firestore.rules`, `firebase/storage.rules` + 31 tes emulator (`firebase/tests/rules.test.ts`).
- Middleware `requireAuth` / `requireAdmin` (`services/api/src/middleware/auth.ts`): pesan 401 seragam
  (tidak membedakan token kosong/palsu/kedaluwarsa), 403 untuk non-admin.
- Validasi environment gagal-cepat; production menolak emulator, project `demo-*`, dan DOKU production.
- Helmet, CORS terbatas ke `WEB_ORIGIN`, rate limit global 120/menit/IP, batas body 100 KB.
- Kontrak Maps/DOKU gagal-tertutup (`verifyNotification` selalu `false` sampai Fase 09).

## Tambahan Fase 02 (autentikasi)
- Verifikasi token server-side dengan `checkRevoked`; 401 seragam; identitas hanya dari token; `requireVerifiedEmail` untuk endpoint inti.
- Rate limit per rute (`/v1/me/init` 10/menit) dan galat 500 generik; log menyunting `authorization`, `req.body.password`, `req.body.idToken`.
- Kata sandi tidak melewati backend kita, tidak ada di Firestore/log/storage (diuji: integrasi + E2E).
- Pesan galat anti enumerasi; jeda kirim ulang di klien. Detail: docs/auth/auth.md.

## Tambahan Fase 03 (profil & avatar)
- `users/{uid}` diperketat menjadi backend-only (sebelumnya klien boleh menulis dengan field allowlist di Fase 00); penulisan sekarang atomik dengan `user_private/{uid}` lewat `PUT /v1/me/profile`.
- Shell aplikasi (`(app)`) menegakkan `stage === ready` (email terverifikasi + profil lengkap); tahap lain diarahkan otomatis. Ini penegakan UX; keamanan sebenarnya tetap di Rules/backend.
- Preferensi privasi kota: `cityVisible=false` menghapus `cityId` sepenuhnya dari dokumen publik (bukan mengosongkan), diverifikasi lewat tes integrasi terhadap Firestore sungguhan.
- Ditemukan saat pengujian: konfigurasi CORS awal hanya mengizinkan GET/POST/OPTIONS sehingga PUT (simpan profil) diblokir browser meski panggilan langsung non-browser tetap berhasil (CORS hanya ditegakkan browser). Diperbaiki dengan menambah PUT ke `methods`, dan diberi tes regresi (`app.test.ts` > CORS).

## Tambahan Fase 04 (Discovery)
- Query list `activities` wajib menyertakan `status in [published,full]` — dibuktikan lewat tes Rules bahwa query tanpa filter itu ditolak total oleh Firestore (bukan disaring diam-diam). Lihat docs/discovery/discovery.md.
- Draft tetap hanya terlihat pembuatnya (warisan Fase 00, tidak berubah); `fetchActivityById` memperlakukan permission-denied sama seperti "tidak ditemukan" (tidak membocorkan keberadaan draft orang lain).
- Tidak ada endpoint backend baru di fase ini, sehingga tidak ada permukaan serangan API baru.

## Tambahan Fase 05 (Maps & Lokasi)
- Places API (New) hanya dipanggil dari backend (kunci server); klien tidak pernah memegang kunci berkemampuan Places. Kunci browser hanya untuk memuat Maps JavaScript API (dibatasi HTTP referrer), tidak bisa dipakai memanggil Places.
- Rute `/v1/places/*` mensyaratkan token terautentikasi; galat gateway diteruskan sebagai 502 generik, detail internal tidak pernah dikirim ke klien (diuji).
- Lokasi pengguna ("Terdekat") memakai izin `navigator.geolocation` bawaan browser, bukan API Google — lokasi tidak pernah dikirim ke Google, hanya dipakai untuk query Firestore + perhitungan jarak di klien.

## Risiko yang diketahui / ditunda
| Risiko | Rencana |
|---|---|
| Rate limit in-memory per instance dan berbasis IP | Store terdistribusi/per-uid/Cloud Armor dinilai di Fase 11 |
| App Check belum aktif | Bertahap: monitor dulu, enforce setelah klien stabil |
| Peran admin lewat custom claim belum ada mekanisme pemberian (hanya diuji dengan Admin SDK di emulator) | Fase 10 (RBAC + audit) |
| Enumerasi email pada pendaftaran bergantung pengaturan project Firebase | Aktifkan email enumeration protection (docs/auth) |
| Belum ada MFA, deteksi perangkat baru, atau App Check | Dinilai di Fase 11 |
| `users` dapat dibaca semua pengguna masuk | Sesuai desain profil publik (ditinjau di Fase 03, dipertahankan by design); privasi granular per-field ditunda ke fase relevan |
| Identitas pelapor | `reports` tertutup dari klien; akses moderator hanya via API (Fase 08/10) |

## Pengujian minimum (Lampiran B) — status Fase 00
- Anonim ditolak membaca `user_private`, `wallets`, `wallet_ledger`, `payments`, `reports`: **diuji**.
- Pengguna A tidak dapat mengubah data privat B: **diuji**.
- Klien tidak dapat menulis saldo/ledger/payment/admin: **diuji**.
- Token backend invalid ditolak: **diuji** (unit + smoke terhadap Auth Emulator).
- Join paralel tidak overbook, webhook duplikat: **belum berlaku** (Fase 06, 09).
- Secret tidak di log/bundle: **pemindaian manual** (lihat laporan fase); pemindaian otomatis di Fase 11.
