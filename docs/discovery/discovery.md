# Activity Discovery (Fase 04)

## Arsitektur: klien membaca Firestore langsung
Sesuai keputusan arsitektur Fase 00, Discovery **tidak** punya endpoint backend untuk membaca
daftar/detail ajakan. `apps/web/src/lib/activities/read.ts` memanggil Firestore Web SDK
langsung dari browser (`getDocs`/`getDoc`, one-shot — bukan `onSnapshot`), tunduk pada
Security Rules yang sama seperti pengguna lain. Backend baru terlibat mulai Fase 06 (menulis
ajakan, kapasitas, state machine).

## Mengapa Fase 04 mendahului Fase 06 ("Buat Ajakan")
Blueprint menomori Discovery sebelum Invitation & Participation. Karena UI pembuatan ajakan
sungguhan belum ada, skema `activities` (Lampiran A) diimplementasikan sekarang dan data
contoh ditulis lewat Admin SDK (`services/api/test/seed-activities.ts`, dipakai skrip dev
`seed-demo-activities.ts` maupun tes integrasi/E2E) — bukan lewat alur produk. Ini bukan jalan
pintas Rules: Rules Fase 00 sudah backend-only untuk `activities`, seeding lewat Admin SDK
konsisten dengan itu.

## Skema tambahan (`packages/shared/src/schemas/activity.ts`)
Field baru di luar Lampiran A minimum: `titleLower` (turunan `title`, untuk pencarian awalan),
`description` (opsional), `venueName` (nama tempat berupa teks bebas), `startsAt`/`createdAt`
sebagai epoch milliseconds (bukan Firestore Timestamp — skema `shared` sengaja bebas
dependensi Firebase; konversi Timestamp↔number terjadi di `lib/activities/read.ts`).
`placeId` dicadangkan untuk Places API (Fase 05); belum dipakai menampilkan apa pun.

`venueName` adalah keputusan produk sementara: tanpa integrasi Maps, lokasi ajakan hanya teks
bebas. Fase 05 kemungkinan menambah `placeId` terverifikasi di sampingnya, bukan
menggantikannya (nama tempat tetap berguna sebagai label tampilan).

## Query dan batas nyata Firestore
Tiga jenis feed, semuanya SELALU menyertakan `where('status', 'in', ['published', 'full'])`:

| Feed | Filter | Urutan | Batas |
|---|---|---|---|
| **Rekomendasi** (`fetchDiscoveryPage`) | + `startsAt > now`, opsional `cityId`/`categoryId` | `startsAt` naik | Bersih: setiap halaman persis berisi item yang belum lewat waktu. |
| **Terbaru** (`fetchRecentPage`) | tanpa filter tambahan | `createdAt` turun | Kedaluwarsa disaring **di klien** setelah dibaca — Firestore hanya izinkan satu field rentang (`>`,`<`,dst.) per query, dan field itu wajib jadi `orderBy` pertama. Karena di sini yang diurutkan `createdAt`, filter `startsAt>now` tidak bisa ikut di query. |
| **Pencarian** (`fetchSearchPage`) | `titleLower` rentang awalan (`>=prefix`, `<prefix+`) | `titleLower` naik | Sama seperti Terbaru: kedaluwarsa disaring di klien. Filter kota/kategori **dinonaktifkan** saat mencari (dihindari agar tidak butuh indeks komposit `status+titleLower+cityId` dst. yang membengkak). |

**Konsekuensi jujur**: untuk Terbaru dan Pencarian, satu halaman bisa berisi **lebih sedikit
kartu** dari ukuran halaman yang diminta bila sebagian hasil mentah ternyata sudah kedaluwarsa
— dokumen itu tetap terhitung sebagai baca (`readCount`), sesuai biaya Firestore sungguhan,
tidak disembunyikan. `DiscoveryPage.readCount` selalu melaporkan jumlah dokumen yang benar-benar
dibaca, terpisah dari `items.length` (jumlah yang lolos saring).

## Pencarian BUKAN full-text
Firestore tidak punya full-text search bawaan. `fetchSearchPage` melakukan **pencocokan
awalan** (prefix match) pada `titleLower` — cara standar Firestore untuk "dimulai dengan",
bukan substring/full-text. "santai" tidak akan menemukan "Ngopi **santai** sore" karena
"santai" bukan awalan judul. Alternatif sungguhan (Algolia, Typesense, Meilisearch, dll.) di
luar lingkup fase ini dan tidak diasumsikan/diagumi di sini.

## Mengapa list query wajib menyertakan filter status
Security Rules `activities` (Fase 00): `allow read: if status != 'draft' || (pemilik)`. Untuk
**query list** (bukan `get` satu dokumen), Firestore hanya mengizinkan operasi bila rule bisa
dibuktikan berlaku untuk SEMUA kandidat hasil TANPA membaca isi dokumennya — bila query tidak
membatasi status, Firestore menolak seluruh query (bukan menyaring diam-diam), karena dokumen
draft bisa saja ikut terbawa. Query dengan `where('status','in',['published','full'])` lolos
karena rule otomatis benar untuk semua hasil yang mungkin. Dibuktikan lewat tes emulator:
`firebase/tests/rules.test.ts` → "query list ajakan aktif berhasil bila menyertakan filter
status; gagal total tanpa filter itu".

## Indeks komposit (`firebase/firestore.indexes.json`)
`status+startsAt`, `status+cityId+startsAt`, `status+categoryId+startsAt`,
`status+cityId+categoryId+startsAt` (Rekomendasi + filter), `status+createdAt desc` (Terbaru),
`status+titleLower` (Pencarian). Kategori/kota sengaja **tidak** dikombinasikan dengan Terbaru
atau Pencarian untuk membatasi jumlah indeks.

## Pagination
Cursor berbasis `startAfter(lastDocumentSnapshot)` (bukan offset). Ukuran halaman 10
(`PAGINATION.defaultSize`), maksimum 20 (`PAGINATION.maxSize`) — sama seperti kontrak Fase 00.
Heuristik "ada halaman berikutnya": bila hasil yang diterima persis sama dengan ukuran halaman
yang diminta. Diuji lintas beberapa halaman tanpa duplikat maupun terlewat
(`apps/web/test/activities.integration.test.ts`).

## Hasil pengujian baca (biaya) — dari tes integrasi terhadap emulator sungguhan
- Halaman Rekomendasi ukuran 5: `readCount === items.length` (tidak ada baca sia-sia; filter
  `startsAt>now` sudah di server).
- Halaman Rekomendasi ukuran 20 dari total ~14 data contoh: `readCount ≤ 20`, tidak pernah
  membaca seluruh koleksi tanpa `limit`.
- Pencarian "Ngopi" (3 hasil valid dari data contoh): `readCount ≥ items.length` — satu hasil
  mentah (yang sudah kedaluwarsa) ikut terbaca lalu disaring, sesuai desain yang didokumentasikan
  di atas.
- Tidak ada skenario yang membaca seluruh koleksi `activities` tanpa `limit()`.

## Keputusan produk yang perlu ditinjau
- **8 kategori** (`ACTIVITY_CATEGORY_CATALOG`): Ngopi, Makan, Nonton, Jalan-jalan, Buku,
  Olahraga, Game, Lainnya — mengikuti referensi desain.
- **Filter kota/kategori** hanya berlaku di tab Rekomendasi (bukan Terbaru), untuk membatasi
  jumlah indeks komposit. Bila produk butuh filter di semua tab, indeks tambahan perlu dibuat.
- **"Terdekat"** (lokasi terdekat pengguna) adalah placeholder — butuh geohash/lokasi pengguna,
  dibangun di Fase 05.
