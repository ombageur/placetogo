# Penerapan desain mockup 30 layar

Dokumen ini mencatat perubahan yang dilakukan agar implementasi mengikuti mockup 30 layar,
beserta hal yang sengaja dibiarkan berbeda. Audit yang mendahuluinya ada di
`docs/design/audit/README.md`.

## Perubahan struktural

### Beranda (mockup layar 12)

Mockup menyusun Beranda sebagai: sapaan, kartu aktivitas aktif, lalu daftar "Rekomendasi untukmu"
berupa baris ringkas. Implementasi sebelumnya menyisipkan grid "Kategori Aktivitas" yang tidak ada
di mockup, dan merender rekomendasi sebagai kartu besar. Grid kategori dihapus, dan rekomendasi kini
memakai baris ringkas yang sama seperti mockup.

Blok cadangan berisi dua ajakan karangan ("Makan ramen bareng", "Jalan sore di Taman Kota") yang
muncul saat Firestore kosong juga dihapus. Data karangan yang tampak seperti data asli menyesatkan;
penggantinya adalah keadaan kosong yang jujur dan mengajak pengguna membuat ajakan pertama.

### Jelajah – List (mockup layar 13)

Mockup mengelompokkan ajakan menurut jam mulai, dengan judul grup "18:00 | 36 ajakan". Implementasi
sebelumnya **meniru tampilan itu dengan data yang di-hardcode**: tiga baris tetap berisi "Ngopi
santai di Tuku", "Makan ramen bareng", dan "Diskusi buku" lengkap dengan jumlah karangan, sementara
data asli dari Firestore dirender terpisah di bawah judul "Ajakan Lainnya" dengan gaya kartu yang
berbeda. Artinya layar itu tampak sesuai mockup tetapi tidak menampilkan isi basis data.

Sekarang pengelompokan dihitung dari data asli lewat `groupActivitiesByHour`, jumlah per grup adalah
hitungan sebenarnya, dan setiap barisnya menautkan ke ajakan yang benar. Bagian "Ajakan Lainnya"
dihapus karena daftar bergrup itu sendiri sudah merupakan seluruh feed.

### Komponen baru

`apps/web/src/components/activities/activity-row.tsx` berisi baris ajakan ringkas sesuai mockup
(ikon kategori dalam lingkaran mint, judul, satu baris keterangan, pil kapasitas) dan dipakai oleh
Beranda maupun Jelajah. Pil kapasitas memakai warna bahaya lembut saat penuh. Subjudulnya punya dua
varian: "Hari ini • 18.00 • 2,4 km" untuk Beranda, dan nama venue untuk Jelajah karena jamnya sudah
menjadi judul grup.

### Detail aktivitas (mockup layar 16–19)

Label tab diubah dari "Venue & Promo" menjadi "Venue", sesuai bilah tab di mockup; "Venue & Promo"
di mockup adalah judul halamannya, bukan label tabnya.

## Perbaikan yang ditemukan saat penerapan

### Token `--warning` tidak pernah didefinisikan

`globals.css` mendefinisikan `--warning-soft` dan `--warning-soft-foreground`, tetapi tidak pernah
mendefinisikan `--warning`. Padahal 32 tempat di 14 berkas memakai `text-warning`, `bg-warning`,
`border-warning/30`, dan sejenisnya. Di Tailwind v4 utilitas tanpa token tidak menghasilkan CSS apa
pun, sehingga kelas-kelas itu diam-diam tidak berefek. Akibat yang terlihat: ikon koin di Beranda
adalah glif putih di atas lingkaran yang seharusnya emas tetapi tak berlatar, jadi praktis tak
terlihat.

Perbaikannya memakai token yang memang sudah ada: latar, garis, dan ring memakai `--coin` (#f5b301,
emas koin yang sama dengan mockup), sedangkan warna teks memakai `--warning-soft-foreground`
(#7a4b00) yang memenuhi kontras. Token `--warning` sengaja tidak ditambahkan karena emas koin
berkontras 1,86:1 terhadap putih dan tidak layak dipakai sebagai warna teks.

### Kontras bilah tanggal

Label hari pada bilah tanggal Jelajah ("SEL", "RAB", …) memakai `opacity-80` di atas teks muted,
menghasilkan #72817b pada putih — 4,08:1, di bawah ambang AA 4,5:1 untuk teks 10px. `opacity-80`
dihapus sehingga rasionya menjadi 6,51:1.

### Target sentuh di bawah 44px

Lihat `docs/design/audit/README.md` butir 5; cakupannya meluas ke Beranda (pil koin, "Lihat Detail",
"Lihat semua"), Jelajah (toggle List/Peta, tombol filter, tiga chip filter), Buat Ajakan (tombol
kembali, input tanggal/jam/kapasitas), dan navigasi samping pada lebar >= 768px.

## Perbedaan yang sengaja dipertahankan

- **Jelajah punya kontrol lebih banyak daripada mockup**: bilah "Rekomendasi / Terdekat / Terbaru",
  chip kategori, dan pemilih kota. Ketiganya adalah fitur nyata dari fase sebelumnya yang diuji di
  `apps/web/e2e/discovery.spec.ts`; menghapusnya demi kemiripan visual berarti menghapus fungsi.
- **Avatar berwarna tunggal.** Mockup memakai avatar hewan berwarna-warni; implementasi memakai glif
  hijau tua satu warna. Menggantinya perlu aset ilustrasi yang belum ada.
- **Ilustrasi onboarding.** Mockup memakai ilustrasi pemandangan; implementasi memakai ikon pin
  abstrak. Sama seperti di atas, perlu aset yang belum ada.
- **Peta** belum aktif karena Google Maps API key belum diberikan.

## Penyederhanaan filter Jelajah

Halaman Jelajah sempat punya tiga baris penyaring yang saling tumpang tindih: bilah
Rekomendasi/Terdekat/Terbaru, chip kategori, dan chip Jam/Minat/Radius yang membuka modal Filter.
Kategorinya muncul dua kali (chip di halaman dan chip Minat di dalam modal). Dua baris pertama
dihapus, menyisakan chip yang sesuai mockup layar 13.

Konsekuensinya ditangani, bukan dibiarkan:

- **Kategori** kini dipilih dari chip Minat di dalam modal, lalu diterapkan lewat tombol Terapkan.
- **Pencarian terdekat** kehilangan satu-satunya pintu masuknya bersama tab Terdekat. Sebelumnya
  slider "Radius lokasi" pada modal Filter tidak melakukan apa pun — nilainya tidak pernah dipakai
  saat Terapkan ditekan. Slider itu sekarang benar-benar menjalankan pencarian berbasis geohash
  dengan radius pilihan pengguna, sehingga fitur Fase 05 tetap terjangkau dan chip "Radius < 20km"
  tidak lagi sekadar hiasan. Izin lokasi hanya diminta ketika slidernya digeser.
- **Tab Terbaru** hilang dari antarmuka. Pustaka `fetchRecentPage` beserta ujinya tetap ada, tetapi
  tidak ada lagi jalan ke sana dari UI.
- `discovery-tabs.tsx` dan `city-filter.tsx` menjadi tidak terpakai. Berkasnya sengaja tidak
  dihapus; silakan hapus bila memang tidak akan dipakai lagi.

Uji E2E `apps/web/e2e/discovery.spec.ts` ikut disesuaikan: penyaringan kategori dan radius kini
digerakkan lewat modal, dan uji tab Terbaru dihapus karena fiturnya tidak lagi ada di UI.

## Pemilihan kota hanya di header

Dropdown "Semua kota" di halaman Jelajah dihapus. Ternyata pemilih kota di header selama ini hanya
kosmetik: ia menyimpan pilihan ke localStorage dan menyiarkan event `cityChange`, tetapi **tidak ada
satu pun komponen yang mendengarkan event itu**, sehingga menggantinya tidak mengubah hasil apa pun.
Sekarang halaman Jelajah membaca kota tersimpan saat dimuat dan ikut menyesuaikan ketika header
menyiarkan perubahan. Kunci penyimpanan dan nama eventnya dipindah ke
`apps/web/src/lib/city-preference.ts` agar kedua sisi tidak memakai string yang berbeda.

## Jarak pada kartu ajakan

Mockup menampilkan jarak pada setiap baris ajakan ("Hari ini · 18.00 · 3,8 km"), tetapi implementasi
hanya menampilkannya pada hasil pencarian terdekat, karena penelusuran biasa memang tidak membawa
jarak dari Firestore. Sekarang jaraknya dihitung di klien dengan haversine ketika lokasi pengguna
diketahui dan ajakannya punya koordinat.

Lokasi itu diambil lewat `useViewerPosition`, yang **tidak pernah memunculkan dialog izin**: ia hanya
memakai lokasi bila izinnya sudah diberikan sebelumnya, atau bila masih ada hasil tersimpan di sesi
berjalan. Pengguna yang belum pernah mengizinkan lokasi tidak akan terganggu, dan barisnya cukup
tampil tanpa jarak.


## Kartu ajakan pada daftar

Susunan kartunya mengikuti referensi desain terbaru: ubin ikon kategori 56px di kiri, lalu judul
dengan satu baris keterangan `tempat · hari, jam · jarak`, dua chip (metode pembayaran dan
kategori), dan ketersediaan kursi di kanan beserta tanda panah.

Ketersediaan ditulis sebagai angka yang langsung bisa ditindaklanjuti — "4 kursi tersisa" atau
"Penuh" — bukan pecahan seperti 1/5, karena yang ingin diketahui calon peserta adalah masih ada
tempat atau tidak. Jumlah lengkapnya tetap tampil kecil di bawahnya.

Dua penyesuaian untuk lebar ponsel, karena referensinya dibuat pada lebar desktop:

- Judul kartu memakai ukuran eksplisit 14px (16px mulai `sm`). Tanpa itu judul mengikuti skala H3
  merek yang 20px, ukuran untuk judul seksi, sehingga judul kartu terpotong di layar sempit.
- Judul boleh membungkus sampai dua baris di ponsel dan baru dipotong mulai `sm`. Memotong judul
  seperti "Jalan santai & cari te…" menghilangkan artinya, sementara membungkus tidak.

Ikon minat tidak diubah; yang berubah hanya bentuk ubin dan tata letak di sekitarnya.


## Jelajah dikelompokkan per rentang jam

Daftar Jelajah dikelompokkan ke dalam rentang satu jam dengan judul seperti
`13.00 – 13.59 | 2 aktivitas`. Kuncinya tanggal sekaligus jam, bukan jamnya saja, supaya ajakan
pada jam yang sama di hari berbeda tidak tergabung menjadi satu kelompok.

Setiap kartu menampilkan jam mulai dan hari di kolom kiri, sehingga keterangan di bawah judul
cukup memuat tempat dan jarak.

`CurrentTimeBadge` menampilkan jam sekarang di sisi kanan bilah filter dan memperbaruinya tiap
setengah menit. Gunanya memberi titik acuan saat membaca daftar yang dikelompokkan per jam:
kelompok mana yang sudah lewat, dan mana yang sebentar lagi. Jamnya baru dirender setelah komponen
terpasang di klien, karena merendernya saat render pertama akan membuat keluaran server dan klien
berbeda.

### Penyesuaian lebar ponsel

Referensi desainnya dibuat pada lebar desktop. Kolom waktu menambah lebar tetap pada kartu,
sehingga di 430 piksel judul dan keterangan kehabisan ruang. Tiga penyesuaian, semuanya hanya
berlaku di bawah breakpoint `sm`:

- Ubin ikon 44 piksel dan kolom waktu 40 piksel, kembali ke 56 piksel di atasnya.
- Label ketersediaan dipersingkat menjadi "4 kursi"; kata "tersisa" muncul mulai `sm`.
- Chip boleh membungkus ke baris kedua. Memotongnya agar muat satu baris membuat nama kategori
  terbaca sebagian, misalnya "Pertemar".


### Bilah tanggal menjadi penyaring yang sungguhan

Chip "Jam: 18:00", "Semua Minat", dan "Radius < 20km" dihapus dari Jelajah. Ketiganya hanya membuka
modal Filter yang tetap bisa dijangkau lewat tombol filter di kanan judul, sehingga penyaringan
minat dan radius tidak hilang.

Sebagai gantinya, bilah tanggal di atas daftar kini benar-benar menyaring. Sebelumnya pilihan
tanggal disimpan ke state tetapi tidak pernah dipakai, jadi menekan tanggal mana pun tidak mengubah
isi daftar. Memilih "Semua" menampilkan seluruh hasil.

Penyaringan tanggal dilakukan di klien terhadap hasil yang sudah dimuat. Firestore hanya mengizinkan
satu field rentang per query, dan field itu sudah dipakai `startsAt > sekarang` pada query
penelusuran, sehingga batas awal dan akhir hari tidak bisa ditambahkan di sisi server.

Keadaan kosong membedakan kedua sebabnya: bila tanggal sedang dipilih, pesannya mengarahkan untuk
memilih tanggal lain atau "Semua", bukan menyarankan mengubah kata kunci pencarian.

Pemilihan kota tetap berasal dari header dan tidak terpengaruh perubahan ini.
