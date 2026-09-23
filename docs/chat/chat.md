# Fase 07: Real-time Chat & Diskusi Ajakan (Spesifikasi & Dokumentasi)

Dokumen ini menjelaskan arsitektur sistem percakapan real-time (*chat*), model data Firestore, mekanisme sinkronisasi keanggotaan grup, antarmuka pengiriman pesan via API, dan integrasi UI pada platform `placetogo.id`.

---

## 1. Arsitektur Percakapan & Model Data

Sistem chat dirancang hybrid:
- **Tulis (Kirim Pesan)**: Melalui REST API backend (`POST /v1/conversations/:id/messages`) untuk menjamin validasi keanggotaan, sanitasi teks, rate limiting, dan pencatatan audit.
- **Baca (Real-time Stream)**: Melalui Firestore Client SDK (`onSnapshot`) yang mendengarkan perubahan secara instan dengan efisiensi tinggi, diizinkan oleh Firebase Security Rules hanya untuk `memberIds`.

### Skema Dokumen Firestore

#### Koleksi: `conversations/{id}`
Menyimpan metadata ruang percakapan:
- `id`: string (sama dengan `activityId` untuk grup ajakan)
- `type`: `'activity' | 'direct'`
- `activityId`: string (opsional)
- `title`: string (nama ajakan atau judul obrolan)
- `memberIds`: array string UID peserta
- `lastMessageAt`: epoch ms waktu pesan terakhir
- `lastMessageText`: cuplikan isi pesan terakhir (maks 80 karakter)
- `lastSenderId`: UID pengirim pesan terakhir
- `createdAt`: epoch ms waktu pembuatan
- `updatedAt`: epoch ms waktu pembaruan

#### Subkoleksi: `conversations/{id}/messages/{messageId}`
Menyimpan riwayat pesan:
- `id`: string ID pesan
- `conversationId`: string ID percakapan induk
- `senderId`: string UID pengirim
- `senderName`: string nama tampilan avatar pengirim
- `senderAvatarId`: string identifier ilustrasi avatar
- `body`: string isi pesan (1–1000 karakter)
- `createdAt`: epoch ms timestamp waktu pengiriman

---

## 2. Sinkronisasi Anggota Otomatis

Ruang percakapan grup ajakan disinkronkan secara otomatis pada siklus hidup ajakan:
1. **Publikasi Ajakan (`publish`)**: Membuat dokumen `conversations/{activityId}` dengan `memberIds = [creatorId]`.
2. **Peserta Bergabung (`join`)**: Menambahkan UID peserta baru ke `memberIds` menggunakan `FieldValue.arrayUnion(uid)` dalam transaksi database.
3. **Peserta Keluar (`leave`)**: Menghapus UID peserta dari `memberIds` menggunakan `FieldValue.arrayRemove(uid)` dalam transaksi database.

---

## 3. Kontrak REST API

| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|---|
| `GET` | `/v1/conversations` | Daftar semua percakapan yang diikuti pengguna | Bearer (Ready) |
| `GET` | `/v1/conversations/:id` | Detail metadata percakapan | Anggota |
| `GET` | `/v1/conversations/activity/:activityId` | Ambil / inisialisasi percakapan ajakan | Anggota / Creator |
| `POST` | `/v1/conversations/:id/messages` | Mengirim pesan ke percakapan | Anggota |

### Kode Kesalahan (Error Codes)
- `400 validation_error`: Format pesan kosong atau melebihi 1000 karakter.
- `403 forbidden`: Pengguna mencoba membaca/mengirim pesan di percakapan yang bukan anggotanya.
- `404 conversation_not_found`: Dokumen percakapan tidak ditemukan.
- `429 too_many_requests`: Melebihi batas frekuensi pengiriman (rate limit 30 pesan/menit).

---

## 4. Antarmuka Pengguna (UI Screens 13, 16–19)

1. **Inbox Chat (`/chat`)**:
   - Menampilkan daftar percakapan aktif pengguna secara real-time dengan cuplikan pesan terakhir, waktu relatif, dan jumlah peserta.
2. **Ruang Chat Penuh (`/chat/[id]`)**:
   - Tampilan obrolan satu layar penuh dengan daftar pesan, bubble warna (*mint* untuk sendiri, *neutral card* untuk teman), avatar pengirim, auto-scroll ke bawah saat pesan baru tiba, dan formulir kirim pesan.
3. **Tab Sub-Navigasi Detail Ajakan (`/jelajah/[id]`)**:
   - **Tab Detail (16)**: Informasi lengkap waktu, tempat, dan peta.
   - **Tab Peserta (18)**: Daftar avatar peserta yang telah bergabung dengan indikator Inisiator/Level.
   - **Tab Venue & Promo (17)**: Profil venue (tautan Google Maps), info reward Coin, dan voucher promo.
   - **Tab Diskusi (19)**: Chat grup real-time yang tersemat langsung untuk koordinasi pertemuan.
