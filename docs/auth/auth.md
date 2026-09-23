# Autentikasi dan onboarding (Fase 02)

## Model sesi
- **Penyedia**: Firebase Authentication (email + kata sandi). Google hanya tampil bila
  `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` dan provider dikonfigurasi di Firebase Console.
- **Sesi di klien**: SDK Firebase menyimpan sesi persisten (IndexedDB) dan memperbarui ID token otomatis.
  Kata sandi tidak pernah disentuh backend kita, tidak disimpan di Firestore, dan tidak dicatat di log.
- **Backend**: setiap permintaan privat membawa `Authorization: Bearer <ID token>`. Server memverifikasi
  dengan `verifyIdToken(token, checkRevoked=true)`: token palsu, rusak, kedaluwarsa, dicabut
  (`revokeRefreshTokens`), atau milik akun yang dinonaktifkan/dihapus ditolak dengan **401 seragam**.
- **Tidak memakai cookie sesi**: tidak ada halaman yang dirender server dengan data privat; data privat selalu
  lewat API/Rules dengan token. Bila kelak ada SSR privat, tambahkan cookie sesi httpOnly (dinilai di Fase 04+).
- **Pembatas rute klien** (`RequireAuth`, `PublicOnly`) hanyalah UX. Konten privat tidak dirender sebelum sesi
  terverifikasi, tetapi penegakan sebenarnya ada di Security Rules dan backend.

## Tahap akun
`resolveAccountStage` (packages/shared): `verify_email` -> `profile_incomplete` -> `ready`.

| Kondisi | Tujuan |
|---|---|
| belum masuk | `/mulai` (pengunjung baru) atau `/masuk` (sudah pernah melihat pengenalan) |
| masuk, email belum terverifikasi | `/verifikasi-email` (rute privat lain tertutup) |
| terverifikasi, profil belum lengkap | `/` dengan pengingat "Profil belum lengkap" -> `/lengkapi-profil` |
| terverifikasi, profil lengkap | `/` |

`ENFORCE_PROFILE_COMPLETION` (`apps/web/src/lib/auth/routes.ts`) saat ini `false`; Fase 03 mengubahnya menjadi
`true` bersama formulir profil. `profileComplete` disimpan di `user_private/{uid}` dan hanya ditulis backend.

## Alur
1. **Pengenalan** `/mulai`: empat layar, "Lewati", "Sudah punya akun? Masuk". Status "sudah melihat" hanya di
   localStorage (urutan tampilan, bukan keamanan).
2. **Daftar** `/daftar`: validasi Zod bersama (`registerSchema`: email valid; sandi 8-128 karakter, huruf + angka),
   `createUserWithEmailAndPassword` lalu `sendEmailVerification`.
3. **Verifikasi** `/verifikasi-email`: "Saya sudah verifikasi" memuat ulang pengguna + token (agar klaim
   `email_verified` ikut baru), kirim ulang dengan jeda 60 dtk, periksa otomatis saat tab kembali fokus.
4. **Masuk** `/masuk`, **Reset** `/lupa-password`, **Keluar** (kartu akun di `/profil`).
5. Tautan di email memakai halaman aksi bawaan Firebase (tidak ada halaman aksi kustom di Fase 02).

## Pesan galat aman (anti enumerasi)
`authErrorMessage` (`apps/web/src/lib/auth/errors.ts`): email tidak terdaftar, sandi salah, dan kredensial tidak
valid semuanya "Email atau kata sandi salah."; reset kata sandi selalu menjawab "Jika email tersebut terdaftar..."
(kecuali galat jaringan/rate limit); kode tak dikenal menjadi pesan generik; pesan mentah SDK tidak pernah tampil.
Pendaftaran dengan email yang sudah ada memakai pesan netral (batasan: Firebase tetap dapat membocorkan keberadaan
email pada pendaftaran kecuali fitur *email enumeration protection* diaktifkan di project; lihat Manual Actions).

## Strategi rate limit
| Lapisan | Batas | Catatan |
|---|---|---|
| Firebase Auth | throttling bawaan (`auth/too-many-requests`) | ditangani dengan pesan ramah |
| Klien | jeda 60 dtk kirim ulang verifikasi dan reset | mengurangi klik berulang |
| API global | 120 permintaan/menit/IP | `@fastify/rate-limit` |
| `GET /v1/me` | 60/menit/IP | |
| `POST /v1/me/init` | 10/menit/IP | normalnya sekali per akun |

Batasan: store in-memory per instance Cloud Run dan berbasis IP (NAT seluler berbagi IP). Strategi terdistribusi
(per-uid, Cloud Armor/Redis) dinilai di Fase 11. `RATE_LIMIT_ALLOWLIST` hanya untuk uji lokal dan ditolak saat
`APP_ENV=production`.

## Data
`user_private/{uid}` = `{ schemaVersion: 1, profileComplete: false, createdAt, updatedAt }`. Tidak ada email,
kata sandi, atau token di Firestore. Dokumen dibuat idempoten oleh `POST /v1/me/init` (transaksi).

## Manual Actions sebelum project asli
1. Firebase Console > Authentication > Sign-in method: aktifkan Email/Password. Google opsional (butuh OAuth client;
   lalu set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`).
2. Authorized domains: tambahkan domain App Hosting/kustom. Sesuaikan templat email (bahasa Indonesia, nama pengirim).
3. Aktifkan *email enumeration protection* dan tetapkan kebijakan kata sandi di project (jika tersedia pada paket).
4. Tetapkan admin lewat custom claim dari skrip berhak akses (Fase 10); jangan dari klien.
5. Verifikasi paket/biaya Firebase Auth di halaman harga resmi sebelum mengaktifkan fitur di luar email/Google.
