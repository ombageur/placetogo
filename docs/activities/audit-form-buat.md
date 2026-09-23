# Audit form Buat Ajakan terhadap halaman detail

Dilakukan setelah halaman detail ajakan berubah. Pertanyaannya: apakah yang ditampilkan halaman
detail benar-benar berasal dari apa yang dipilih pembuat ajakan di formnya?

## Temuan

### 1. Sifat ajakan ditampilkan tetap, tanpa pernah dipilih siapa pun — sudah diperbaiki

Halaman detail menampilkan tiga tag pada setiap ajakan: "Suasana santai", "Ramah introvert", dan
"Obrolan bebas". Ketiganya ditulis langsung di kode, identik untuk semua ajakan, dan form tidak
punya cara memilihnya. Jadi tag itu tidak menyampaikan informasi apa pun tentang ajakan yang sedang
dilihat — padahal justru informasi semacam inilah yang dibutuhkan pengguna introvert untuk menilai
apakah suasananya cocok sebelum bergabung.

Sekarang sifat ajakan menjadi data sungguhan:

- `ACTIVITY_TRAIT_CATALOG` di paket bersama memuat delapan sifat: ramah introvert, suasana santai,
  obrolan bebas, grup kecil, di tempat publik, ramah pemula, tanpa alkohol, dan akses ramah difabel.
- Form Buat Ajakan menampilkannya sebagai checklist dengan batas empat pilihan, disertai penghitung
  dan penjelasan bahwa bagian ini boleh dikosongkan.
- Halaman detail hanya menampilkan sifat yang benar-benar dipilih, dan menyembunyikan bagian itu
  bila tidak ada yang dipilih.
- Skema memvalidasi nilainya terhadap katalog dan menolak yang melebihi batas.

### 2. Deskripsi karangan untuk ajakan tanpa deskripsi — sudah diperbaiki

Ajakan yang deskripsinya kosong diisi kalimat tetap: "Ngopi sore di {venue} sambil ngobrol santai…".
Kalimat itu keliru untuk ajakan seperti badminton atau nonton film, dan pembacanya tidak punya cara
tahu bahwa kalimat itu bukan tulisan pembuat ajakan. Sekarang ditampilkan keterangan singkat bahwa
pembuat ajakan belum menambahkan deskripsi.

## Masih terbuka

### 3. Tombol suka dan simpan tidak menyimpan apa pun

`isLiked` dan `isSaved` hanya state lokal di komponen. Tidak ada endpoint, tidak ada penyimpanan.
Tetapi notifikasinya menyatakan "Ajakan berhasil disimpan ke bookmark kamu" — padahal setelah
halaman dimuat ulang keadaannya hilang. Perlu diputuskan: dibuatkan penyimpanannya, atau tombolnya
dihapus sampai fiturnya ada.

### 4. Promo venue dijanjikan tanpa dasar data

Modal promo menjanjikan "Diskon 10% Komunitas" dan "Reward 2.000 Coin" di **setiap** venue, tanpa
ada data kemitraan di baliknya. Ini bukan sekadar tampilan: pengguna bisa datang ke venue lalu
menuntut diskon yang tidak pernah disepakati pemilik tempat. Sebaiknya promo hanya muncul untuk
venue yang memang terdaftar sebagai mitra, dengan isi promo diambil dari data mitra tersebut.

## Bidang yang sudah selaras

Judul, deskripsi, kategori, kota, nama tempat, waktu mulai, kapasitas, metode pembayaran, dan
koordinat lokasi semuanya dikumpulkan form, divalidasi skema, disimpan backend, dan ditampilkan
halaman detail apa adanya.
