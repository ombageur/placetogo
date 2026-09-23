# Aset logo placetogo

## Berkas

Semuanya ada di `apps/web/public/`:

| Berkas | Ukuran | Dipakai untuk |
| --- | --- | --- |
| `brand/placetogo-logo.webp` | 250 × 100 | Arsip: berkas asli yang diberikan, apa adanya |
| `brand/placetogo-logo-trimmed.webp` | 726 × 147 | Logo tanpa tagline: header dan navigasi samping |
| `brand/placetogo-logo-tagline.webp` | 726 × 147 | Logo bertagline: layar splash dan auth |
| `brand/placetogo-mark.webp` | 237 × 147 | Logomark tanpa tulisan |
| `icon.png` | 180 × 180 | Favicon |

Semua varian dipotong dari berkas asli dengan memindai piksel, bukan ditebak: celah kolom kosong
di x = 85 memisahkan gelembung dari tulisan, dan celah baris di y = 60–61 memisahkan tulisan merek
dari taglinenya.

Varian tanpa tagline dibuat dengan **menghapus** area tagline, bukan memotongnya secara mendatar.
Gelembung di kiri memanjang sampai sejajar tagline, sehingga potongan mendatar akan ikut memangkas
bagian bawah gelembung.

Berkasnya diperbesar tiga kali sebelum disimpan supaya tetap tajam pada layar beresolusi tinggi;
logo header ditampilkan 138 × 28 dan varian bertagline 277 × 56.

`icon.png` diberi latar putih penuh, bukan transparan, karena gelembung hijau tuanya akan hilang
pada bilah tab bertema gelap.

## Pemakaian di kode

`apps/web/src/components/brand/logo.tsx` mengekspor dua komponen yang memuat aset itu lewat
`next/image`:

- `Logo` — gelembung beserta tulisan "placetogo". Prop `withTagline` menambahkan tagline
  "Ngobrol, Nongkrong, Jadi Cerita"; dipakai hanya di layar yang ruangnya lega (splash dan auth),
  karena pada header setinggi 28 piksel taglinenya mengecil sampai tidak terbaca.
- `LogoMark` — hanya gelembungnya, untuk ruang sempit seperti navigasi samping yang menyempit dan
  layar pemuatan.

Keduanya diukur lewat **tinggi**, dan lebarnya mengikuti rasio asli. Jangan memakai utilitas persegi
seperti `size-12` pada komponen ini karena akan menggepengkan gambarnya; pakai `h-*` saja.

`Logo` menerima prop `alt`. Pada header dan navigasi samping, logonya dibungkus tautan beranda yang
sudah memiliki `aria-label="placetogo.id, ke Beranda"`, jadi di sana `alt=""` supaya pembaca layar
tidak mengumumkan mereknya dua kali. Di halaman auth, `Logo` berdiri sendiri dan memakai `alt`
bawaannya.

## Catatan: warna logo berbeda dari token merek

Warna di dalam logo baru tidak sama dengan palet yang dikunci `apps/web/src/styles/tokens.test.ts`:

| Peran | Warna di logo | Token aplikasi |
| --- | --- | --- |
| Hijau tua (tulisan, gelembung tengah) | `#002d1e` | `--primary` `#174d3b` |
| Hijau medium (gelembung kiri) | `#4aa162` | tidak ada padanannya |
| Oranye ("to", gelembung kanan) | `#fcb012` | `--coin` `#f5b301` |

Palet aplikasi **tidak diubah**, karena `#174D3B` dan `#28664F` ditetapkan blueprint sebagai warna
merek dan dikunci oleh uji token. Logo tampil apa adanya sebagai gambar, sehingga warnanya tetap
seperti yang diberikan. Jika palet aplikasi memang ingin disamakan dengan logo, itu keputusan
identitas merek yang perlu diputuskan tersendiri, lalu token dan ujinya diperbarui bersama-sama.

## Aset lama

`apps/web/public/icon.svg` berisi logomark lama (pin lokasi) dan **sudah tidak dirujuk** sejak
favicon diarahkan ke `icon.png`. Berkasnya sengaja tidak dihapus; silakan hapus bila memang tidak
diperlukan lagi.

## Font

Mockup memakai **Segoe UI**, font sistem Windows — terlihat dari bentuk 'g' berperut tunggal pada
"Pengalaman" dan 'y' berekor lurus pada "banyak". Aplikasi memakai tumpukan
`ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, …`, yang pada Windows juga menghasilkan
Segoe UI. Ini bukan dugaan: pemeriksaan lewat Chrome DevTools Protocol
(`CSS.getPlatformFontsForNode`) pada halaman yang berjalan melaporkan font yang benar-benar dipakai
adalah **Segoe UI** untuk teks biasa dan **Segoe UI Semibold** untuk tombol.

Jadi di Windows fontnya sudah sama persis dan tidak ada yang perlu diubah. Perlu diketahui bahwa
`system-ui` menghasilkan font berbeda di platform lain: Roboto di Android, SF Pro di iOS dan macOS.
Bila tampilan huruf harus identik di semua perangkat, langkahnya adalah memuat satu webfont dan
menetapkannya di `--font-sans`. Segoe UI sendiri tidak boleh didistribusikan sebagai webfont karena
lisensinya, jadi pilihannya adalah font bebas yang mirip.
