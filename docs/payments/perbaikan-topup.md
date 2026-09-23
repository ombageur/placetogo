# Perbaikan top-up: nilai undefined dan polling liar

Top-up gagal dengan pesan dari Firestore:

```
Value for argument "data" is not a valid Firestore document.
Cannot use "undefined" as a Firestore value (found in field "vaNumber").
```

## Sebab: Firestore menolak undefined, TypeScript tidak

`createTopup` membangun dokumen pembayaran dengan `vaNumber` dan `qrString` sekaligus, padahal
keduanya saling eksklusif: metode virtual account mengisi `vaNumber` dan membiarkan `qrString`
undefined, QRIS sebaliknya. Bagi TypeScript itu sah, karena field opsional yang bernilai `undefined`
dianggap sama dengan field yang tidak ada. Firestore membedakannya: menulis `{ vaNumber: undefined }`
ditolak, sedangkan menghilangkan kuncinya diterima. Galatnya karena itu baru muncul saat dijalankan.

Dua tempat lain mengidap kesalahan yang sama dan belum terlihat karena belum terpakai:
`credit` dan `debit` menulis baris ledger dengan `note: note || undefined`, sehingga setiap kredit
atau debit tanpa catatan akan gagal dengan cara yang persis sama.

## Perbaikan

`services/api/src/lib/firestore-data.ts` menyediakan `withoutUndefined`, yang membuang kunci bernilai
`undefined` tepat sebelum penulisan. Ketiga penulisan di atas memakainya.

Setelan `ignoreUndefinedProperties` pada Firestore sengaja **tidak** dipakai. Setelan itu berlaku
global, sehingga field yang keliru tidak terisi akan hilang secara senyap di seluruh aplikasi, bukan
hanya di tempat yang memang opsional.

## Uji regresi

`services/api/src/modules/wallet/store.test.ts` memakai Firestore palsu yang merekam dokumen yang
ditulis, lalu memastikan tidak ada satu pun nilai `undefined` untuk **setiap** metode pembayaran,
serta memastikan `vaNumber` hanya ada pada metode VA dan `qrString` hanya pada QRIS.

Ujinya sudah dibuktikan menangkap bugnya: dengan perbaikan dilepas sementara, ketujuh kasusnya gagal;
dengan perbaikan terpasang, semuanya lolos.

## Bug kedua: halaman invoice membanjiri backend

Setelah top-up berhasil, halaman invoice justru menampilkan "Pesanan tidak ditemukan". Penyebabnya
bukan pembayaran, melainkan efek polling di
`apps/web/src/app/(app)/dompet/bayar/[orderId]/payment-view.tsx`: state `payment` menjadi dependensi
efek, padahal badan efeknya langsung memanggil pengambilan data. Setiap respons menghasilkan objek
baru, dependensinya berubah, dan efeknya berjalan lagi tanpa henti.

Terukur: **lebih dari 110 permintaan `GET /v1/payments/{orderId}` dalam enam detik**, sampai menabrak
batas laju 120 permintaan per menit. Respons 429 itulah yang membuat halaman menyerah dan menampilkan
"Pesanan tidak ditemukan".

Perbaikannya menyimpan status terakhir di ref sehingga `payment` tidak lagi menjadi dependensi, dan
kegagalan saat polling tidak lagi menghapus invoice yang sudah tampil — hanya kegagalan pemuatan
pertama yang ditampilkan sebagai galat. Setelah perbaikan: **5 permintaan dalam 14 detik**, semuanya
200, sesuai interval empat detik yang dimaksudkan.
