# Fase 08: Meeting Confirmation, Check-in & Post-Meeting Flow (Spesifikasi & Dokumentasi)

Dokumen ini menjelaskan alur siklus hidup pertemuan, konfirmasi kehadiran dan integrasi kalender, sistem verifikasi check-in di venue dengan reward 2.000 Coin, apresiasi koin antarpeserta pasca-pertemuan, serta integrasi UI (Screens 20–23) pada platform `placetogo.id`.

---

## 1. Siklus Hidup Pertemuan (State Machine)

Status aktivitas (`ActivityStatus`) memiliki siklus hidup yang diperluas:

```
[ published / full ]
       |
       +---> [ in_progress ]  (Dimulai oleh creator saat waktu pertemuan tiba)
       |            |
       |            +---> [ completed ] (Diselesaikan oleh creator setelah pertemuan usai)
       |
       +---> [ cancelled ]    (Dibatalkan oleh creator kapan saja sebelum selesai)
```

### Transisi Status:
1. **`published` / `full`**: Ajakan dibuka dan peserta dapat bergabung.
2. **`in_progress`**: Pertemuan telah dimulai di lokasi. Peserta dan creator dapat melakukan **Check-in Venue** dan mengklaim reward kehadiran.
3. **`completed`**: Pertemuan telah selesai. Tombol **Beri Apresiasi** dibuka agar anggota dapat saling mengirimkan koin apresiasi dan catatan hangat.
4. **`cancelled`**: Ajakan dibatalkan oleh inisiator; aktivitas ditutup untuk interaksi selanjutnya.

---

## 2. Model Data & Skema Firestore

### A. Subkoleksi Check-in: `activities/{activityId}/checkins/{uid}`
Mencatat klaim kehadiran pengguna di venue:
- `uid`: string UID peserta/creator yang melakukan check-in.
- `activityId`: string ID ajakan.
- `checkedInAt`: epoch ms waktu check-in.
- `rewardAmount`: number jumlah koin reward yang diklaim (default: `2000`).
- `location`: object opsional koordinat GPS saat check-in `{ lat: number, lng: number }`.

### B. Koleksi Apresiasi: `appreciations/{id}`
Mencatat transfer apresiasi koin dan pesan apresiasi antarpeserta:
- `id`: string ID unik dokumen apresiasi.
- `activityId`: string ID ajakan terkait.
- `fromUid`: string UID pengirim.
- `toUid`: string UID penerima.
- `amount`: number nominal koin yang dikirimkan (min. 1.000 Coin).
- `note`: string teks pesan hangat (opsional, maks 200 karakter).
- `createdAt`: epoch ms waktu pengiriman.

---

## 3. Kontrak REST API Backend

| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|---|
| `POST` | `/v1/activities/:id/start` | Mengubah status aktivitas menjadi `in_progress` | Creator |
| `POST` | `/v1/activities/:id/complete` | Mengubah status aktivitas menjadi `completed` | Creator |
| `POST` | `/v1/activities/:id/checkin` | Verifikasi check-in & klaim 2.000 Coin reward | Anggota / Creator |
| `GET` | `/v1/activities/:id/checkin` | Mengambil status check-in pengguna saat ini | Anggota / Creator |
| `POST` | `/v1/appreciations` | Mengirim apresiasi koin & catatan hangat | Anggota / Creator |
| `GET` | `/v1/appreciations/activity/:activityId` | Riwayat apresiasi pada aktivitas terkait | Anggota / Creator |

---

## 4. Antarmuka Pengguna & Modals (Screens 20–23)

Sesuai panduan UI alur 30 layar:

1. **Screen 20: Konfirmasi Bergabung & Kalender (`JoinSuccessModal`)**:
   - Ditampilkan seketika setelah pengguna berhasil bergabung (`join`).
   - Memberikan konfirmasi visual sukses, ringkasan waktu & tempat, serta tombol integrasi cepat **"Tambah ke Google Calendar"** dengan format tanggal dan parameter URL otomatis.

2. **Screen 21: Klaim Reward & Check-in di Venue (`MeetingCheckinModal`)**:
   - Dapat diakses saat status aktivitas `in_progress` atau `completed`.
   - Mengambil izin geolokasi GPS perangkat secara opsional dan memvalidasi kehadiran.
   - Mengklaim reward 2.000 Coin langsung ke saldo akun pengguna.

3. **Screen 22: Beri Apresiasi Teman (`AppreciationModal`)**:
   - Dapat diakses saat status aktivitas `completed`.
   - Memilih avatar teman peserta pertemuan.
   - Pilihan nominal chip koin preset (2.000, 5.000, 10.000, 20.000, 50.000) atau nominal custom.
   - Input pesan hangat opsional.

4. **Screen 23: Pertemuan Selesai (`MeetingSuccessModal`)**:
   - Layar penutup setelah proses apresiasi selesai.
   - Navigasi menuju riwayat profil atau kembali ke beranda jelajah.
