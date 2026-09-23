# Keputusan: tidak memakai Material UI

Pertanyaan yang muncul saat audit desain: apakah perlu memakai Material UI (MUI) agar tampilan
sesuai mockup? Keputusannya **tidak**. Berikut alasannya, supaya tidak perlu dibahas ulang.

## 1. Blueprint sudah menetapkan tumpukan UI

Master Prompt proyek menetapkan Next.js App Router, TypeScript, Tailwind, dan **shadcn/ui**.
Mengganti ke MUI berarti menyimpang dari dokumen implementasi yang disetujui.

## 2. Mockup bukan desain Material

Mockup memakai bahasa visual sendiri: hijau tua `#174D3B`, kartu ber-radius besar (`1.25rem`),
bottom nav dengan tombol "+" menonjol, chip mint lembut, bayangan halus. Material Design punya
aturan sendiri soal elevasi, tipografi Roboto, ripple, dan bentuk komponen. Memakai MUI berarti
melawan default-nya di hampir setiap komponen, atau menerima tampilan yang justru **menjauh** dari
mockup.

## 3. Token desain sudah cocok

`apps/web/src/styles/globals.css` sudah mendefinisikan palet, radius, dan bayangan persis seperti
mockup, dan seluruh komponen memakainya. Audit 30 layar menemukan hanya lima masalah kosmetik kecil,
bukan ketidakcocokan sistemik. Masalah sekecil itu diperbaiki dengan menyetel kelas, bukan dengan
mengganti framework.

## 4. Biayanya besar, manfaatnya tidak ada

Migrasi ke MUI berarti menulis ulang 50+ komponen, menambah Emotion dan runtime MUI ke bundel yang
menyasar pengguna seluler Indonesia, lalu tetap harus meng-override gayanya agar kembali mirip
mockup. Dua sistem desain berdampingan justru membuat perawatannya lebih sulit.

## Yang dilakukan sebagai gantinya

Tetap Tailwind + shadcn/ui, lalu perbaiki butir-butir spesifik yang ditemukan audit. Daftarnya ada
di `docs/design/audit/README.md`.
