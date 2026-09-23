# Fase 09: Coin Economy, Dompet Digital & Integrasi Pembayaran DOKU (Spesifikasi & Dokumentasi)

Dokumen ini menjelaskan model ekonomi koin non-withdrawable (`Coin Economy`), manajemen saldo dompet pengguna (`wallets`), pencatatan transaksi buku besar (`wallet_ledger`), dan integrasi gateway pembayaran DOKU Sandbox untuk Top-up Koin (Screens 24–27) pada platform `placetogo.id`.

---

## 1. Arsitektur Ekonomi Koin

Coin pada `placetogo.id` berfungsi sebagai mata uang komunitas internal untuk:
- **Beri Apresiasi Teman**: Mengirim hadiah koin dan pesan apresiasi pasca-pertemuan.
- **Reward Kehadiran**: Mengklaim reward 2.000 Coin saat check-in di venue aktivitas.
- **Klaim Voucher & Promo**: Menukarkan diskon dan penawaran di venue mitra.

> [!NOTE]
> **Kebijakan Finansial**: Sesuai regulasi dan desain produk, Coin bersifat *non-withdrawable* (tidak dapat dicairkan kembali ke rupiah) dan hanya beredar di dalam ekosistem platform.

---

## 2. Paket Top-up Resmi (`TOPUP_PACKAGES`)

| ID Paket | Nominal Koin | Bonus Koin | Total Koin | Harga (IDR) | Tag Promosi |
|---|---|---|---|---|---|
| `pkg_10k` | 10.000 | 0 | 10.000 | Rp 10.000 | — |
| `pkg_25k` | 25.000 | 1.000 | 26.000 | Rp 25.000 | +1.000 Bonus |
| `pkg_50k` | 50.000 | 3.000 | 53.000 | Rp 50.000 | Populer · +3.000 Bonus |
| `pkg_100k` | 100.000 | 10.000 | 110.000 | Rp 100.000 | +10.000 Bonus |
| `pkg_250k` | 250.000 | 30.000 | 280.000 | Rp 250.000 | Terbaik · +30.000 Bonus |

---

## 3. Model Data & Skema Firestore

### A. Koleksi `wallets/{uid}`
Menyimpan saldo aktif per pengguna:
- `balance`: number (integer non-negatif saldo koin).
- `version`: number (integer versioning untuk optimistic locking / transaksi).
- `updatedAt`: epoch ms waktu pembaruan saldo.

### B. Koleksi `wallet_ledger/{id}`
Buku besar transaksi mutasi koin (bersifat *immutable / append-only*):
- `id`: string ID unik entry ledger.
- `uid`: string UID pemilik koin.
- `delta`: number (+/- nominal perubahan koin).
- `type`: `'topup' | 'reward_checkin' | 'appreciation_send' | 'appreciation_receive' | 'admin_adjustment'`.
- `referenceId`: string ID referensi (orderId, activityId, atau appreciationId).
- `note`: string catatan transaksi.
- `createdAt`: epoch ms waktu pencatatan.

### C. Koleksi `payments/{orderId}`
Menyimpan riwayat pesanan pembayaran:
- `orderId`: string ID pesanan (format: `TOPUP-{timestamp}-{random}`).
- `uid`: string UID pembeli.
- `packageId`: string ID paket top-up.
- `coinAmount`: number total koin yang didapatkan.
- `amountIdr`: number harga paket dalam rupiah.
- `paymentMethod`: `'qris' | 'bca_va' | 'mandiri_va' | 'bri_va' | 'doku_checkout'`.
- `status`: `'pending' | 'paid' | 'failed' | 'expired'`.
- `paymentUrl`: string URL checkout DOKU / simulator lokal.
- `vaNumber`: string nomor Virtual Account (opsional).
- `qrString`: string payload QRIS (opsional).
- `createdAt`, `updatedAt`, `paidAt`: epoch ms timestamps.

### D. Koleksi `webhook_events/{id}`
Mencegah *double credit* dan menjamin idempotensi webhook DOKU.

---

## 4. Kontrak REST API Backend

| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|---|
| `GET` | `/v1/wallet` | Mengambil saldo koin aktif dan 20 entri riwayat ledger | Bearer |
| `POST` | `/v1/wallet/topup` | Membuat pesanan top-up dan sesi gateway DOKU | Bearer |
| `GET` | `/v1/payments/:orderId` | Polling detail status pembayaran pesanan | Bearer |
| `POST` | `/v1/payments/doku/notify` | Webhook notifikasi pembayaran dari DOKU | HMAC Signature |
| `POST` | `/v1/payments/:orderId/simulate-success` | Simulasi pembayaran instan untuk pengujian Sandbox | Bearer |

---

## 5. Antarmuka Pengguna & Layar (Screens 24–27)

1. **Screen 24: Dompet Koin & Riwayat (`/dompet`)**:
   - Card saldo beraksen emas-mint dengan tombol *Top Up Koin*.
   - Statistik Koin Masuk & Koin Terpakai.
   - Filter riwayat (Semua, Top Up, Reward Venue, Apresiasi) dengan badge delta (+/-).
2. **Screen 25: Pilih Paket Top Up (`TopupModal`)**:
   - Grid 5 paket koin resmi dengan indikator bonus.
   - Pemilih metode bayar (QRIS, BCA VA, Mandiri VA, BRI VA).
3. **Screen 26: Layar Pembayaran & Invoice (`/dompet/bayar/[orderId]`)**:
   - Tampilan rincian tagihan, countdown batas waktu 60 menit, QRIS scanner, dan nomor VA.
   - Tombol simulasi Sandbox untuk kemudahan verifikasi lokal tanpa merchant keys asli.
4. **Screen 27: Top Up Sukses (`TopupSuccessModal`)**:
   - Animasi perayaan koin, informasi saldo baru, dan navigasi cepat.
