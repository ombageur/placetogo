# Statistik profil dan halaman Hadiah

## Sebelumnya: angka karangan

Halaman profil menampilkan lencana "Level 3" dan tiga angka: 12 Pertemuan, 5 Ajakan, dan saldo
Coin. Lencana level dan dua angka pertama **ditulis langsung di kode**, sama untuk setiap pengguna,
padahal tidak ada sistem level di aplikasi ini. Angka itu tidak menyampaikan apa pun tentang
pengguna yang sedang dilihat.

## Sekarang

Lencana level dihapus. Ketiga angka berasal dari `GET /v1/me/stats`, dihitung backend:

| Angka | Sumber | Bisa diklik |
| --- | --- | --- |
| Pertemuan | jumlah check-in terverifikasi milik pengguna | tidak |
| Ajakan | jumlah ajakan yang dibuat pengguna | ya, ke `/profil/ajakan` |
| Hadiah | jumlah apresiasi yang diterima | ya, ke `/hadiah` |

Angkanya dikumpulkan di backend, bukan klien, karena sumbernya tersebar di tiga tempat dan
Security Rules tidak mengizinkan klien membacanya secara luas: ajakan ada di koleksi `activities`,
check-in ada di subkoleksi tiap ajakan (dihitung lewat collection group), dan hadiah ada di koleksi
`appreciations`. Bila statistiknya gagal dimuat, angkanya ditampilkan sebagai "—", bukan diganti
nilai contoh.

"Pertemuan" sengaja tidak bisa diklik karena belum ada halaman riwayat pertemuan yang datanya
nyata; membuat tautan ke halaman berisi contoh akan mengulang masalah yang baru saja diperbaiki.

## Halaman Ajakan Saya

`/profil/ajakan` menampilkan ajakan yang dibuat pengguna, termasuk draft dan yang sudah lewat.
Datanya lewat `GET /v1/me/activities`, bukan query Firestore dari klien, karena Rules hanya
mengizinkan klien membaca ajakan yang sudah terbit — draft milik sendiri tidak termasuk.

## Halaman Hadiah

`/hadiah` menampilkan apresiasi koin yang diterima beserta totalnya, lewat
`GET /v1/appreciations/received`.

### Dukungan tanpa aktivitas

Sebelumnya apresiasi **wajib** tertaut sebuah ajakan (`activityId` bersifat wajib di skema), jadi
hanya bisa dikirim setelah bertemu. Sekarang `activityId` opsional, sehingga dukungan bisa dikirim
langsung dari halaman Hadiah tanpa ikut aktivitas lebih dulu. Halaman detail hadiah membedakan
keduanya: "dari sebuah pertemuan" atau "dukungan lepas".

Dengan begitu jumlah hadiah bisa menjadi penanda seberapa aktif dan disukai seseorang di komunitas,
tidak terbatas pada pertemuan yang pernah diikutinya.

### Penerima masih diisi manual

Modal dukungan meminta id pengguna tujuan karena aplikasi belum punya pencarian pengguna. Begitu
pencarian tersedia, kolom itu tinggal diganti pemilih pengguna tanpa mengubah alur pengirimannya.

## Perbaikan yang ditemukan saat pengujian

`POST /v1/appreciations` tidak menangani galat domain sama sekali, sehingga saldo yang tidak cukup
menghasilkan **HTTP 500** tanpa penjelasan. Sekarang menjadi **409** dengan pesan yang bisa
ditindaklanjuti pengirim.

## Indeks Firestore

Dua query baru memerlukan indeks, sudah didaftarkan di `firebase/firestore.indexes.json`:
`appreciations` (toUid + createdAt) dan `checkins` dengan cakupan collection group (uid).
