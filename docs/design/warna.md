# Sistem warna placetogo.id

## Hijau merek diukur dari mockup

`--primary` sekarang **#136548**, hasil pengukuran langsung dari mockup 30 layar, bukan dari angka
yang tertulis di blueprint (#174D3B). Cara mengukurnya: seluruh piksel poster mockup dihistogram,
lalu diambil klaster hijau pekat yang paling sering muncul — itu warna tombol dan header, dengan
puncak di #136548 (0,50% piksel) dan varian antialias #166549, #166b4d, #136046 di sekitarnya.

Perubahan ini disetujui secara eksplisit dan menyimpang dari hex di blueprint, jadi
`tokens.test.ts` ikut diperbarui. Seluruh pasangan kontras diperiksa ulang dan tetap lolos AA:
putih di atas hijau 7,04:1, hijau di atas putih 7,04:1, di atas kanvas 6,60:1, di atas mint 6,29:1,
di atas mint pekat 5,60:1. Emas koin di atas hijau 3,80:1 — hanya dipakai untuk ikon, bukan teks.

Tiga puluh sembilan penulisan #174D3B yang tertanam langsung di kode (ikon avatar dan manifest)
ikut diganti agar tidak ada dua hijau yang berbeda.


Sumber kebenaran tunggal ada di blok `:root` pada `apps/web/src/styles/globals.css`, dan dijaga oleh
`apps/web/src/styles/tokens.test.ts` yang membaca berkas CSS itu langsung lalu menghitung rasio
kontras setiap pasangan.

## Lapisan permukaan

Sebelumnya hampir semua bidang memakai `--background` putih, sehingga kartu putih menyatu dengan
halaman putih dan hanya dipisahkan garis tipis. Sekarang permukaannya bertingkat:

| Token | Nilai | Peran |
| --- | --- | --- |
| `--surface` | `#f3f9f5` | Kanvas halaman (`body`), bernuansa mint tipis |
| `--card` | `#ffffff` | Bidang kartu yang terangkat di atas kanvas |
| `--background` | `#ffffff` | Putih merek; header, bilah navigasi, dan kontrol |
| `--muted` | `#eef4f1` | Blok redup di dalam kartu (bio, catatan, kode) |
| `--mint-soft` / `--mint` / `--mint-strong` | `#f2f9f5` / `#e9f5ee` / `#d3ebdd` | Tiga tingkat aksen mint |

`--background` sengaja tetap putih murni karena blueprint menetapkannya sebagai warna merek dan
`tokens.test.ts` mengunci nilainya. Nuansa halaman diberikan lewat token `--surface` yang terpisah,
bukan dengan mengubah putihnya.

Menambahkan nuansa pada kanvas membuat `--border` lama (`#d8e6dd`) nyaris hilang: rasionya terhadap
kanvas hanya 1,21:1. Garisnya dipekatkan menjadi `#c2d8cb` (1,41:1) sehingga tepi kartu tetap
terbaca tanpa menjadi berat.

## Token yang sebelumnya dipakai tanpa pernah didefinisikan

Di Tailwind v4, utilitas yang menunjuk token tak terdefinisi tidak menghasilkan CSS apa pun — jadi
kelasnya diam-diam tidak berefek, tanpa galat. Audit menemukan 64 pemakaian semacam itu:

| Utilitas | Jumlah | Penyelesaian |
| --- | --- | --- |
| `text-warning`, `bg-warning`, `border-warning/*` | 32 | Latar/garis memakai `--coin`; teks memakai `--warning-soft-foreground` |
| `bg-muted` | 17 | Token `--muted` didefinisikan |
| `bg-card` | 7 | Token `--card` didefinisikan |
| `text-success`, `bg-success-soft`, `border-success` | 7 | Token `--success*` didefinisikan |
| `via-primary-strong` | 1 | Token `--primary-strong` didefinisikan |
| `border-mint-soft` | 1 | Token `--mint-soft` didefinisikan |

Akibat yang paling terlihat: ikon koin di Beranda adalah glif putih di atas lingkaran yang
seharusnya emas tetapi tidak berlatar, sehingga praktis tak terlihat.

Token `--warning` sengaja **tidak** ditambahkan. Emas koin berkontras 1,86:1 terhadap putih, jadi
tidak layak menjadi warna teks; memberinya nama `warning` hanya akan mengundang pemakaian keliru.
Emas dipakai lewat `--coin` untuk bidang dan ikon, sedangkan teks peringatan memakai cokelat
`--warning-soft-foreground` (6,72:1 di atas `--warning-soft`).

## Warna yang bentrok dan sudah dibereskan

- **Gradien dompet.** Kartu saldo memakai gradien teal/cyan yang ditulis langsung sebagai heksadesimal
  (`#0F766E → #0D9488 → #14B8A6`), warna mentah di luar palet yang menabrak hijau merek. Diganti
  gradien token `from-primary via-secondary to-primary-strong`.
- **Teks di atas gradien itu.** Kata "Coin" sempat memakai cokelat `--warning-soft-foreground` yang
  hanya 1,10:1 di atas hijau sekunder. Sekarang memakai `--mint` (6,04:1), sesuai mockup layar 26.
  Emas hanya dipakai untuk ikon koin di sebelahnya, yang dekoratif.
- **Bilah tanggal Jelajah.** `opacity-80` di atas teks muted menghasilkan 4,08:1 pada teks 10px.
  Setelah opasitas dilepas menjadi 6,51:1.
- **Lencana "Level 3".** Putih di atas mint muda, 1,19:1. Sekarang hijau tua di atas `--mint-strong`,
  7,73:1.
- **Judul hero Portal Mitra.** Hijau tua di atas hijau tua karena aturan `h1` pada layer base
  mengalahkan warna yang diwariskan. Sekarang putih eksplisit.

## Tema gelap tidak diimplementasikan

Tidak ada token gelap, `prefers-color-scheme`, provider tema, maupun tombol pengalih di aplikasi ini.
Namun 19 utilitas bervarian `dark:` masih tertinggal di komponen. Varian itu aktif otomatis lewat
`prefers-color-scheme: dark`, sehingga pada perangkat bermode gelap muncul bidang gelap dan teks
terang di atas palet yang tetap terang — misalnya `bg-amber-950/40` di dalam kartu putih. Semuanya
dihapus agar temanya konsisten terang.

Jika tema gelap ingin didukung, langkahnya adalah mendefinisikan ulang seluruh token di dalam blok
`prefers-color-scheme: dark`, bukan menambahkan varian `dark:` per komponen.

## Temuan lain saat sapuan

Sapuan axe diperluas ke rute yang tidak tercakup `apps/web/e2e/routes.spec.ts` (portal mitra, 11 layar
auth dan onboarding). Semuanya pelanggaran yang sudah ada, bukan akibat perubahan warna:

- `/mitra/promo` meredupkan kartu promo nonaktif dengan `opacity-75`, sehingga teksnya turun ke
  3,37:1 dan 3,46:1. Opasitas dilepas; kartu nonaktif kini dibedakan lewat isian `--muted` dan garis
  putus-putus saja. Pola yang sama dengan bilah tanggal: opasitas adalah cara yang rapuh untuk
  meredupkan, karena ikut menggerus kontras teks.
- Tiga sakelar promo hanya berupa ikon tanpa nama yang terbaca pembaca layar; masing-masing diberi
  `aria-label`.
- Tautan lonceng di dasbor mitra tidak punya nama; diberi `aria-label` dan dibesarkan ke 44px.
- Titik indikator slide di `/mulai` memakai `role="tablist"` dengan anak `<button>` ber-`aria-selected`,
  kombinasi ARIA yang tidak sah, dan area sentuhnya hanya 8×8px. Diganti `role="group"` dengan
  `aria-current`, area sentuh 44px, sementara titiknya tetap kecil secara visual.
- Enam kotak input OTP tidak punya label sama sekali; masing-masing diberi `aria-label` "Digit ke-N".
- Lima tombol kembali berukuran 40px dinaikkan ke 44px.

Setelah perbaikan: 11 rute auth/onboarding dan 8 rute aplikasi lain nol pelanggaran axe
(WCAG 2.0/2.1 A + AA) dan nol target sentuh di bawah 44px.

## Menjalankan ulang sapuannya

`apps/web/scripts/audit-ui.mjs` memeriksa tiap rute pada empat viewport: pelanggaran axe, target
sentuh di bawah 44px, dan scroll horizontal. Skrip ini menyasar server pengembangan yang sedang
berjalan, sehingga bisa dipakai ketika `pnpm test:e2e` tidak boleh dijalankan karena akan
menghentikan emulator Firebase yang sedang dipakai. Skrip ini melengkapi, bukan menggantikan,
`apps/web/e2e/routes.spec.ts`.


# Tipografi

Font merek adalah **Poppins**, dimuat lewat `next/font/google` di `apps/web/src/app/layout.tsx`
dengan tiga bobot: Regular (400), Medium (500), dan SemiBold (600). next/font menyajikan berkasnya
dari domain sendiri, jadi tidak ada permintaan ke Google saat halaman dibuka, dan ruangnya sudah
dipesan sejak render pertama sehingga tidak terjadi pergeseran tata letak.

Skala tipografinya mengikuti panduan merek dan ditetapkan sebagai aturan dasar di `globals.css`:

| Peran | Ukuran / tinggi baris | Bobot |
| --- | --- | --- |
| H1 | 32 / 40 | SemiBold |
| H2 | 24 / 32 | SemiBold |
| H3 | 20 / 28 | Medium |
| H4 | 16 / 24 | Medium |
| Body Large | 16 / 24 | Regular |
| Body | 14 / 20 | Regular |
| Caption | 12 / 16 | Regular |
| Button | 14 / 20 | Medium |

Tiga puluh satu elemen `<h1>` sebelumnya menimpa skala ini dengan utilitas `text-2xl font-bold`
sehingga judul halaman tampil 24 piksel, bukan 32. Utilitas itu dilepas agar aturan dasar menjadi
satu-satunya sumber kebenaran; judul yang memang perlu ukuran lain tetap boleh menyetelnya sendiri,
tetapi sekarang itu menjadi keputusan yang disengaja, bukan bawaan.

Perlu dicatat: tumpukan `--font-sans` tetap menyertakan font sistem sebagai cadangan, sehingga
tampilan tetap wajar bila berkas Poppins gagal dimuat.
