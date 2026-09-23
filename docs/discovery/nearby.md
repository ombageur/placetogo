# Google Maps & Location (Fase 05)

## Status: sebagian menunggu kunci API asli
Google Maps Platform tidak punya emulator lokal. Bagian yang murni matematika/Firestore
(geohash, "Terdekat") sudah dibangun dan diuji PENUH terhadap Firestore Emulator sungguhan.
Bagian yang memanggil Google (Places API New, Maps JavaScript API) sudah dibangun lengkap
(kontrak, rute backend, gateway, UI) dan diuji jalur degradasi-anggunnya (kunci kosong), TAPI
panggilan sungguhan ke Google **belum pernah diuji** — menunggu kunci API asli dari pemilik
produk. Lihat "NOT TESTED" di laporan fase untuk daftar lengkap.

## Dua kunci terpisah (wajib, sesuai kebijakan proyek)
| Kunci | Dipakai untuk | Di mana | Pembatasan |
|---|---|---|---|
| **Browser** (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY`) | Memuat Maps JavaScript API (render peta) | `apps/web/src/lib/maps/loader.ts`, masuk bundle browser | HTTP referrer (mis. `localhost:3000/*`) |
| **Server** (`GOOGLE_MAPS_SERVER_API_KEY`) | Places API (New): autocomplete + detail tempat | `services/api/src/modules/maps`, tidak pernah ke browser | IP dan/atau API restriction (hanya Places API) |

Klien **tidak pernah** memanggil Places langsung ke Google — selalu lewat backend kita
(`GET /v1/places/autocomplete`, `GET /v1/places/:placeId`), diautentikasi dan dibatasi laju
(60/menit dan 30/menit per IP). Ini memastikan kunci server tidak pernah terpapar dan semua
panggilan Places tercatat/terkendali di satu tempat.

## Sesi autocomplete
`apps/web/src/lib/maps/session-token.ts` membuat satu `sessionToken` (UUID) per sesi
pencarian (mulai mengetik sampai memilih tempat atau membatalkan), dikirim ke SETIAP
panggilan autocomplete + detail dalam sesi itu, lalu token baru dibuat untuk sesi berikutnya.
Ini standar Places API (New) agar Google menagih satu sesi, bukan per permintaan.

## Field mask minimal
`getPlace` hanya meminta `id,displayName,formattedAddress,location` (tier "Basic Data",
termurah) — bukan jam buka, foto, ulasan, atau data "Atmosphere/Contact" yang lebih mahal.
`autocomplete` hanya mengembalikan teks prediksi (nama + alamat singkat), belum ada koordinat
sampai pengguna memilih salah satu dan `getPlace` dipanggil.

## Kebijakan penyimpanan dan caching
- **Yang disimpan permanen** di dokumen `activities`: `placeId`, `venueName` (nama, disalin
  saat dipilih), `lat`/`lng`, `geohash` turunan. Ini sesuai kebijakan Google Maps Platform:
  Place ID boleh disimpan tanpa batas waktu; field lain (alamat terformat, dll.) hanya
  ditampilkan saat itu juga dari respons `getPlace`, tidak di-cache terpisah lebih lama.
- **Tidak ada cache tambahan** di server atau klien untuk hasil Places (tidak ada tabel
  "places_cache"). Setiap pencarian baru memanggil Places lagi — ini keputusan sengaja untuk
  menghindari menyimpan data yang dilarang disimpan lama, dengan konsekuensi biaya per
  pencarian (lihat Biaya).
- Peta interaktif (`MapView`) sengaja hanya dimuat di **halaman detail** (satu per kunjungan),
  bukan di kartu ajakan — kartu Discovery memakai `venueName` teks biasa, nol panggilan Maps.

## Kartu ajakan tanpa panggilan Places
Diwarisi dari Fase 04 dan tidak berubah: `ActivityCard` hanya menampilkan `venueName`/`cityId`
sebagai teks, tidak pernah memanggil Places atau memuat peta per kartu.

## "Terdekat": geohash (tidak butuh Google API, teruji penuh)
Firestore tidak punya tipe geospasial asli. `packages/shared/src/lib/geohash.ts` meng-encode
koordinat jadi string geohash (presisi tetap 9 karakter per dokumen), dan
`fetchNearbyActivities` (`apps/web/src/lib/activities/read.ts`) men-query 9 sel (pusat + 8
tetangga) sebagai rentang prefix paralel, menggabungkan hasil (dedup by id), lalu menyaring
ulang dengan jarak sungguhan (Haversine) karena bentuk sel geohash bujur sangkar selalu
mencakup area lebih luas dari radius lingkaran yang diminta.

**Keterbatasan yang disengaja**: tidak ada "muat lebih banyak" untuk Terdekat — satu
pengambilan tergabung dari beberapa query rentang sudah kompleks; memberi cursor yang benar
untuk halaman lanjutan lintas rentang+terurut-ulang-jarak adalah masalah terpisah yang lebih
besar, di luar lingkup MVP ini. Sama seperti tab Terbaru dan Pencarian (Fase 04), ajakan
kedaluwarsa disaring di klien (field rentang query sudah dipakai `geohash`), sehingga
`readCount` bisa lebih besar dari jumlah yang tampil — dilaporkan apa adanya, tidak
disembunyikan.

Lokasi pengguna diambil lewat `navigator.geolocation` (izin browser bawaan, BUKAN Google
API apa pun) — diminta hanya saat pengguna membuka tab "Terdekat" (event handler, sesuai
kebijakan browser modern yang mensyaratkan gesture pengguna). Izin ditolak/tidak tersedia
menampilkan pesan jelas dengan tombol coba lagi, bukan galat mentah.

## Indeks Firestore baru
`status ASC, geohash ASC` — melengkapi indeks Fase 04. Query selalu menyertakan
`status in ['published','full']` (alasan sama seperti Fase 04: dibutuhkan agar Firestore
Security Rules bisa membuktikan query list aman tanpa memindai).

## Estimasi biaya (asumsi, BUKAN pengukuran nyata — tarif wajib diverifikasi di halaman
harga resmi Google sebelum dipakai sebagai anggaran)
| Aksi | Panggilan Google | Perkiraan pemicu |
|---|---|---|
| Ketik di kolom cari tempat | 1 autocomplete per jeda 350 md (didebounce) | Beberapa kali per sesi pengisian ajakan |
| Pilih satu saran | 1 getPlace | Sekali per sesi (menutup sesi autocomplete) |
| Buka halaman detail ajakan dengan lokasi | 1 pemuatan Maps JavaScript API | Sekali per kunjungan halaman |
| Jelajah, Beranda, "Terdekat" | 0 | Tidak pernah memanggil Places/Maps |

Field mask minimal dan sesi autocomplete adalah dua kontrol biaya utama yang sudah diterapkan
di kode; kontrol operasional (kuota harian, budget alert) ada di Lampiran D — perlu persetujuan
sebelum diaktifkan di project sungguhan.

## Manual Actions sebelum dipakai dengan project asli
1. Google Cloud Console: aktifkan **Maps JavaScript API** dan **Places API (New)** pada project
   yang sama dengan Firebase (atau project terhubung), billing aktif.
2. Buat kunci **browser**: batasi HTTP referrer ke domain dev/staging/production; API
   restriction ke Maps JavaScript API saja.
3. Buat kunci **server**: batasi API restriction ke Places API; pertimbangkan IP restriction
   ke alamat keluar Cloud Run bila sudah dideploy.
4. Isi `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY` (web) dan `GOOGLE_MAPS_SERVER_API_KEY`
   (services/api) di `.env` lokal — JANGAN commit; keduanya sudah ada di `.gitignore`.
5. Tetapkan kuota harian dan budget alert Maps Platform (Lampiran D) sebelum trafik nyata.
6. Verifikasi bentuk respons `places:autocomplete` dan `places/{id}` sungguhan terhadap
   `services/api/src/modules/maps/google-places-gateway.ts` — kode ini ditulis mengikuti
   dokumentasi resmi tapi belum pernah dites langsung ke API.
