# Audit Desain vs Mockup 30 Layar

Tanggal: 2026-09-22. Metode: Playwright headless Chromium, viewport 430×932 @2x (mobile-first),
login sebagai akun demo admin, tangkapan layar penuh per rute. Berkas `.png` di folder ini adalah
buktinya. Emulator Firebase aktif dengan data seed; Google Maps belum punya API key.

## Ringkasan per seksi mockup

| Seksi mockup | Layar | Status | Rute yang menanganinya |
| --- | --- | --- | --- |
| 1. Onboarding & Registrasi | 11 | Lengkap | `/mulai`, `/daftar`, `/verifikasi-otp`, `/verifikasi-email`, `/lupa-password`, `/masuk`, `/lengkapi-profil`, `/onboarding/avatar`, `/onboarding/minat`, `/onboarding/lokasi`, `/onboarding/area` |
| 2. Beranda & Jelajah | 4 | Lengkap | `/` (beranda), `/jelajah` (List + Peta + modal Filter) |
| 3. Detail & Bergabung | 5 | Lengkap, peta belum aktif | `/jelajah/[id]` (tab Detail / Peserta / Venue & Promo / Diskusi), `/buat` |
| 4. Setelah Bertemu | 3 | Lengkap | `/pertemuan/[id]`, `/apresiasi/[id]`, check-in di halaman detail |
| 5. Profil & Akun | 4 | Lengkap | `/profil`, `/profil/riwayat`, `/dompet`, `/profil/pengaturan` |
| 6. Untuk Bisnis / Venue Partner | 3 | Lengkap | `/mitra`, `/mitra/dashboard`, `/mitra/promo` |

Tidak ada layar mockup yang belum punya rute. Palet, radius, dan bayangan di
`apps/web/src/styles/globals.css` sudah persis mengikuti identitas visual mockup
(hijau tua `#174d3b`, sekunder `#28664f`, mint `#e9f5ee`, latar putih).

## Temuan

### Sudah diperbaiki di audit ini

1. **Judul hero Portal Mitra tidak terbaca.** `<h1>` "Lebih banyak pengunjung, lebih banyak cerita."
   tampil hijau tua di atas panel hijau tua. Penyebabnya `globals.css` menetapkan
   `h1 { color: var(--primary) }` pada layer base; aturan pada elemen selalu mengalahkan warna yang
   *diwariskan* dari `text-white` milik induknya, sehingga judul kehilangan warna putihnya.
   Perbaikan: `text-white` eksplisit di `apps/web/src/app/(app)/mitra/page.tsx`, ditambah komentar
   peringatan di `globals.css`. Hanya `h1` ini yang terdampak; `h1` lain berada di atas latar terang.

2. **Lencana "Level 3" di `/profil` praktis tak terlihat.** Warnanya `text-secondary-foreground`
   (putih) di atas `bg-secondary/20` (mint sangat muda) — rasio kontras hanya **1,19:1**, jauh di
   bawah ambang WCAG AA 4,5:1. Diganti menjadi hijau tua di atas `bg-mint-strong` (**7,73:1**).

3. **Widget "Saldo Coin Komunitas" sempit di lebar 430 px.** Label dan tombol berebut satu baris,
   sehingga label patah dua baris dan tombol "Top Up" ikut patah. Tata letaknya dipecah: blok saldo
   satu baris penuh, lalu dua tombol sejajar dalam grid dua kolom.

4. **Label tab "Venue & Promo" patah dua baris** sehingga tinggi tab tidak rata. Diberi
   `whitespace-nowrap`, ukuran teks 11 px, dan `min-h-11`. Keempat tab kini setinggi 44 px pada
   satu baris tanpa overflow.

5. **Target sentuh di bawah 44 px (temuan susulan, sudah ada sebelum audit).** Saat memverifikasi
   perbaikan di atas dengan asersi yang sama seperti `apps/web/e2e/routes.spec.ts`, ditemukan bahwa
   header aplikasi melanggar ambang 44 px yang diuji berkas itu sendiri: lonceng notifikasi dan
   avatar 36×36, pemilih kota setinggi 30 px. Artinya uji E2E untuk `/profil` sedang dalam keadaan
   gagal. Halaman detail juga punya tombol kembali/bagikan/simpan 40×40 dan tautan
   "Laporkan ajakan ini" setinggi 16 px. Semuanya dinaikkan ke 44 px. Khusus avatar, area sentuhnya
   dibesarkan menjadi 44 px sementara lingkaran visualnya tetap 36 px agar tampilannya tidak berubah.

### Bukan cacat

6. **Lingkaran gelap berhuruf "N" di kiri bawah** pada beberapa tangkapan layar adalah indikator
   devtools Next.js. Hanya muncul pada mode pengembangan, tidak ada di produksi.

### Masih terbuka

7. Peta pada halaman detail menampilkan "Peta tidak tersedia saat ini." karena Google Maps API key
   belum ada. Ini penurunan fungsi yang memang disengaja; Fase 05 berstatus PARSIAL sampai key
   diberikan.
8. Membuka aplikasi lewat `http://127.0.0.1:3000` diblokir CORS karena `WEB_ORIGIN` backend hanya
   mengizinkan `http://localhost:3000`. Hanya mengganggu pengembangan lokal.

## Verifikasi

Dijalankan terhadap server pengembangan yang hidup di port 3000 dengan emulator Firebase aktif:

- `pnpm --filter @placetogo/web typecheck` — lolos.
- Asersi yang menyalin `routes.spec.ts` (axe WCAG 2.0/2.1 A+AA, target sentuh 44 px, scroll
  horizontal, galat konsol) untuk `/profil` dan `/jelajah/[id]`: bersih pada keempatnya.
- Pengukuran langsung di browser: keempat tab detail 44 px pada satu baris tanpa overflow; lencana
  "Level 3" terkomputasi `rgb(23, 77, 59)` di atas `rgb(211, 235, 221)`; tombol "Top Up" 44×178 px.

Suite E2E penuh (`pnpm test:e2e`) **belum dijalankan**, karena skripnya menolak berjalan saat port
emulator sedang terpakai dan menjalankannya akan mematikan lingkungan demo yang sedang hidup.
Perlu dijalankan sekali saat emulator boleh dihentikan.

## Penerapan desain

Setelah audit ini, mockup diterapkan lebih jauh (Beranda, Jelajah, label tab detail) dan beberapa
cacat lain ditemukan saat pengerjaannya. Catatannya ada di `docs/design/penerapan-mockup.md`.

## Catatan Material UI

Audit ini tidak memakai Material UI dan merekomendasikan untuk tidak memakainya. Alasannya ada di
`docs/design/material-ui.md`.
