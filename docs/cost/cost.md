# Biaya dan kontrol (Fase 00)

Tidak ada layanan berbayar yang diaktifkan di Fase 00. Angka tarif sengaja **tidak** ditulis di sini:
tarif harus diambil dari halaman harga resmi terkini dan dikalikan dengan asumsi trafik yang disetujui
(dikerjakan di Fase 11). Budget alert **bukan** hard cap.

## Pendorong biaya
| Layanan | Pendorong | Kontrol di desain |
|---|---|---|
| Firestore | document reads/writes/deletes, penyimpanan, indeks | pagination cursor 10 (maks 20), query terindeks, tanpa listener per kartu, satu listener hanya pada chat terbuka, tanpa full scan. Fase 04: Discovery selalu memakai `limit()`; tab Terbaru/pencarian membaca beberapa dokumen ekstra untuk disaring di klien (dilaporkan lewat `readCount`, lihat docs/discovery) |
| Firebase Auth | pengguna aktif bulanan; verifikasi telepon/SMS bila dipakai | hanya email/Google; tanpa SMS. Fase 02: 1 baca + (sekali) 1 tulis Firestore per akun baru, 1 baca `user_private` per pemuatan aplikasi. Fase 03: `PUT /v1/me/profile` menulis 2 dokumen (users + user_private) atomik per simpan; tarif wajib diverifikasi di halaman harga resmi |
| App Hosting / Cloud Run | CPU-detik, memori, request, egress | `maxInstances` 5 (web) / 10 (API), `minInstances` 0, concurrency 80, timeout 30 dtk |
| Cloud Storage | penyimpanan + egress | avatar bawaan lokal; upload kustom ditunda |
| Maps Platform | Autocomplete, Place Details, Maps JS load | field mask minimal (Basic Data saja), session token per sesi pencarian, peta hanya dimuat di halaman detail (bukan per kartu). Rincian & asumsi: docs/discovery/nearby.md. Tarif belum diverifikasi ke harga resmi — jangan dipakai sebagai anggaran final. |
| FCM | gratis; biaya ada di backend pengirim | tanpa write per pesan dibaca |
| Secret Manager | versi secret + akses | jumlah secret kecil, cache di proses |
| Logging/Monitoring | volume log | level `info`, tanpa payload sensitif |

## Kontrol operasional (manual, perlu persetujuan Lampiran D)
- Budget alert per project (50/90/100%), kuota API Maps harian, batas instance Cloud Run.
- Pisahkan project development dan production; hapus resource development yang tidak dipakai.
