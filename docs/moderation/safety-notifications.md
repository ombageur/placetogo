# Fase 10: Notifikasi Real-time, Laporan Keamanan & Moderasi Komunitas

Dokumen ini menjelaskan arsitektur, skema data, endpoint API, dan alur antarmuka untuk fitur **Notifikasi (Screen 30)**, **Laporan Keamanan (Screen 28–29)**, dan **Panel Moderasi Admin**.

---

## 1. Arsitektur & Prinsip Keamanan

1. **Privasi Notifikasi**: Koleksi `notifications` hanya dapat ditulis oleh Admin SDK (backend service) dan dibaca oleh pemilik `userId` masing-masing (`request.auth.uid == resource.data.userId`).
2. **Kerahasiaan Pelaporan**: Laporan (`reports`) bersifat rahasia. Pengguna biasa hanya dapat membuat (`create`) laporan miliknya. Pembacaan dan tindakan moderasi (`moderate`) hanya diizinkan untuk akun dengan peran `admin` via backend RBAC (`requireAdmin`).
3. **Event-Driven Triggers**: Notifikasi dihasilkan secara otomatis saat terjadi peristiwa di sistem:
   - Pengguna bergabung/batal dari ajakan (`activity_joined`, `activity_left`).
   - Ajakan dibatalkan atau dimulai (`activity_cancelled`, `activity_starting`).
   - Apresiasi kopi / traktiran diterima (`appreciation_received`).
   - Status laporan diperbarui oleh tim moderasi (`report_action_taken`).
   - Pengumuman / sistem (`system_alert`).

---

## 2. Skema Data (Shared Contracts)

### A. Notifikasi (`NotificationDoc`)
- `id`: `string`
- `userId`: `string` (penerima notifikasi)
- `type`: `'activity_joined' | 'activity_left' | 'activity_cancelled' | 'activity_starting' | 'chat_mention' | 'appreciation_received' | 'report_action_taken' | 'system_alert'`
- `title`: `string`
- `message`: `string`
- `actionUrl`?: `string` (tautan tujuan saat notifikasi ditekan)
- `actorId`?: `string` (pelaku yang memicu peristiwa)
- `targetId`?: `string` (ID aktivitas, pesan, atau entitas terkait)
- `read`: `boolean` (status sudah dibaca)
- `createdAt`: `number` (epoch ms)

### B. Laporan Keamanan (`ReportDoc`)
- `id`: `string`
- `reporterId`: `string` (UID pelapor)
- `targetId`: `string` (ID aktivitas, user, atau pesan)
- `targetType`: `'activity' | 'user' | 'message'`
- `category`: `'inappropriate_content' | 'harassment' | 'spam' | 'scam' | 'safety_concern' | 'other'`
- `reason`: `string` (deskripsi kronologi)
- `status`: `'pending' | 'resolved' | 'dismissed'`
- `adminNotes`?: `string`
- `actionTaken`?: `'none' | 'warning' | 'content_removed' | 'account_suspended'`
- `resolvedAt`?: `number`
- `resolvedBy`?: `string`
- `createdAt`: `number`
- `updatedAt`: `number`

---

## 3. Endpoint API Backend (`services/api`)

| Metode | Jalur | Autentikasi | Deskripsi |
|---|---|---|---|
| `GET` | `/v1/notifications` | User | Mengambil daftar notifikasi pengguna terautentikasi dan jumlah unread |
| `PATCH` | `/v1/notifications/:id/read` | User | Menandai satu notifikasi sebagai telah dibaca |
| `POST` | `/v1/notifications/read-all` | User | Menandai seluruh notifikasi pengguna sebagai telah dibaca |
| `POST` | `/v1/reports` | User | Mengirimkan laporan keamanan baru |
| `GET` | `/v1/admin/reports` | Admin RBAC | Mengambil daftar antrean laporan untuk dimoderasi |
| `PATCH` | `/v1/admin/reports/:id` | Admin RBAC | Memproses laporan (menetapkan status, catatan, dan sanksi) |

---

## 4. Antarmuka Pengguna (Screens 28–30)

1. **Screen 28 (`ReportModal`)**:
   - Modal pelaporan dengan pilihan kategori pelanggaran berlabel jelas, input deskripsi alasan, dan peringatan privasi pelaporan.
2. **Screen 29 (`ReportSuccessModal`)**:
   - Modal konfirmasi sukses dengan umpan balik visual apresiasi partisipasi menjaga komunitas.
3. **Screen 30 (`/notifikasi` - `NotificationsView`)**:
   - Pusat notifikasi dengan tab filter (*Semua*, *Ajakan*, *Apresiasi*, *Sistem*), penanda waktu relatif, status unread, dan tombol *Tandai Semua Dibaca*.
4. **Panel Moderasi Admin (`/admin/moderasi` - `ModerationView`)**:
   - Antrean moderasi terpadu dengan filter status, detail target, pengubah status, sanksi (`warning`, `content_removed`, `account_suspended`), dan catatan audit internal.
