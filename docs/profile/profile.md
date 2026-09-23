# Profil & Avatar (Fase 03)

## Model data
Profil disimpan di dua dokumen, ditulis atomik lewat backend (`PUT /v1/me/profile`), tidak pernah
langsung oleh klien (lihat Keamanan di bawah):

| Dokumen | Isi | Sumber kebenaran |
|---|---|---|
| `users/{uid}` (publik) | displayName, avatarId, bio?, cityId? (hanya bila `cityVisible`), interests, createdAt, updatedAt | tampilan publik |
| `user_private/{uid}` | schemaVersion, profileComplete, cityId (selalu, kanonik), cityVisible, createdAt, updatedAt | kanonik, termasuk field privat |

`cityId` di `users/{uid}` **dihapus sepenuhnya** (bukan sekadar dikosongkan) ketika `cityVisible=false`,
sehingga siapa pun yang membaca profil publik tidak tahu kota pengguna. Pemilik tetap melihat kota
aslinya lewat `GET /v1/me/profile`. `createdAt` dipertahankan lintas pengeditan; hanya `updatedAt` berubah.

## Katalog (`packages/shared/src/constants/catalog.ts`)
- **Avatar**: 12 ilustrasi ikon SVG orisinal (dibuat sendiri, bukan aset pihak ketiga) — kucing, beruang,
  rubah, burung hantu, panda, kelinci, koala, robot, alien, tanaman, kopi, buku. Render di
  `apps/web/src/components/profile/avatar-icons.tsx`.
- **Kota**: 14 kota besar Indonesia, daftar statis MVP (bukan panggilan API pihak ketiga). Fase 05 akan
  menambah Places/geocoding untuk lokasi ajakan; daftar kota profil ini independen.
- **Minat**: 14 tag (Ngopi, Kuliner, Buku, Film, Jalan-jalan, Game, Musik, Olahraga, Fotografi, Seni &
  Kerajinan, Alam & Outdoor, Board Game, Teknologi, Hewan Peliharaan). Pengguna memilih 1–8.

## Validasi (`packages/shared/src/schemas/profile.ts`, dipakai klien dan server)
- `displayName`: 2–40 karakter, dipangkas, tanpa baris baru.
- `bio`: opsional, maksimal 100 karakter (ada penghitung di formulir).
- `avatarId`/`cityId`/`interests`: harus dari katalog (enum Zod); minat 1–8, tanpa duplikat.
- Field tak dikenal pada body (mis. `uid`) diabaikan oleh Zod — identitas selalu berasal dari token,
  bukan dari body.

## Alur
1. **Lengkapi profil** (`/lengkapi-profil`, grup rute `(onboarding)`): wajib sudah masuk dan email
   terverifikasi (`RequireAuth mode="verified"`); profil boleh belum ada. Submit sukses memanggil
   `refreshAccount()` (memuat ulang token + status) lalu redirect ke `/`.
2. **Shell aplikasi** (`(app)`, termasuk Beranda/Jelajah/Buat/Chat/Profil): sekarang `RequireAuth
   mode="ready"` — mensyaratkan email terverifikasi **dan** profil lengkap. Selain itu diarahkan ke
   `/verifikasi-email` atau `/lengkapi-profil` sesuai tahap akun (`routeForStage`). Ini menggantikan
   banner pengingat Fase 02 (`ProfileBanner`, sudah dihapus) dengan penegakan penuh.
3. **Edit profil** (`/profil/edit`): memuat profil lewat `GET /v1/me/profile`, formulir sama
   (`ProfileForm`) dipakai ulang, submit sukses kembali ke `/profil`.
4. **Tampilan profil** (`/profil`): avatar, nama, kota (dengan indikator privat bila disembunyikan), bio,
   badge minat, plus kartu akun (email + Keluar) dari Fase 02.

## Keamanan
- **`users/{uid}` sekarang backend-only** (Security Rules `allow write: if false`), berubah dari Fase 00
  yang mengizinkan klien menulis dengan field allowlist. Alasan: penulisan profil harus atomik dengan
  `user_private/{uid}` (menandai `profileComplete`, menerapkan privasi kota), yang sudah backend-only
  sejak awal — memindahkan keduanya ke satu jalur backend menghindari kondisi taktersinkron dan
  memusatkan validasi Zod di satu tempat.
- `PUT /v1/me/profile` mensyaratkan email terverifikasi (`requireVerifiedEmail`), sejalan dengan urutan
  tahap akun. Identitas selalu dari token (`req.user.uid`); tidak ada rute untuk mengubah profil pengguna
  lain, dan field `uid` di body diabaikan.
- Diuji: klien (termasuk pemilik) tidak dapat menulis `users/{uid}` langsung (Rules); dua pengguna
  berbeda tidak saling menimpa profil; token palsu/anonim ditolak; email privat tetap tidak pernah
  disimpan di `users` atau `user_private` (diwarisi dari Fase 02).

## Keputusan yang perlu diketahui
- Foto profil tidak didukung (sesuai "foto tidak wajib"); avatar hanya dari katalog bawaan. Storage
  Rules tetap deny-by-default, tidak ada perubahan — upload avatar kustom didokumentasikan sebagai
  di luar lingkup Fase 03, bukan diimplementasikan sebagian.
- Daftar kota adalah keputusan produk sementara (14 kota besar); perlu ditinjau ulang bila produk
  butuh cakupan kota lebih luas atau granularitas kecamatan.
