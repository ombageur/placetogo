# Ilustrasi onboarding

Layar `/mulai` punya empat slide, dan masing-masing memuat satu berkas ilustrasi dari
`apps/web/public/images/`. Nama berkasnya sudah ditetapkan di kode, jadi menambahkan
ilustrasi cukup dengan menaruh berkasnya — tanpa perubahan kode.

| Slide | Judul | Berkas | Ukuran |
| --- | --- | --- | --- |
| 1 | Temukan teman di sekitarmu. | `onboarding-1-temukan-teman.webp` | 820×818 |
| 2 | Pilih aktivitas yang kamu suka. | `onboarding-2-pilih-aktivitas.webp` | 820×666 |
| 3 | Aman dan nyaman. | `onboarding-3-aman-nyaman.webp` | 820×682 |
| 4 | Mulai sekarang. | `onboarding-4-mulai-sekarang.webp` | 820×671 |

Keempatnya sudah terisi.

## Ketentuan berkas

- Format **WebP** dengan latar transparan. Ilustrasinya tampil tanpa bingkai maupun latar, jadi
  menyatu langsung dengan kanvas halaman.
- Lebar 820 piksel. Ditampilkan pada sekitar 382 piksel, sehingga masih tajam di layar 2x.
- Rasio bebas: tingginya mengikuti gambar, dan ukurannya dicantumkan di `SLIDES` supaya tidak
  terjadi pergeseran tata letak saat gambarnya selesai dimuat.
- Pangkas area transparan sampai habis sebelum dipakai. Berkas mentah dari pembuat gambar biasanya
  menyisakan sekitar sepertiga kanvas kosong di atas, yang membuat ilustrasi tampil kecil.
- Palet mengikuti identitas aplikasi: hijau tua `#136548`, hijau medium `#4aa162`, mint `#e9f5ee`,
  dengan aksen oranye `#fcb012` secukupnya.

## Perilaku bila berkasnya belum ada

`apps/web/src/components/onboarding/onboarding-illustration.tsx` menampilkan komposisi ikon
sebagai cadangan ketika berkas gambarnya tidak ada atau gagal dimuat. Jadi slide yang ilustrasinya
belum siap tetap tampil utuh, bukan sebagai bingkai kosong. Begitu berkasnya ditaruh dengan nama di
atas, slide tersebut otomatis memakai ilustrasinya.


# Sampul aktivitas

Halaman detail ajakan menampilkan satu ilustrasi sampul per kategori, berukuran 1200×675
(rasio 16:9) di `apps/web/public/covers/<id>.webp`. Keduabelas kategori sudah terisi:
ngobrol, olahraga, film, seni, karier, komunitas, pertemanan, kuliner, video, buku, relawan,
dan hewan.

Petanya diturunkan dari `ACTIVITY_CATEGORY_IDS` di
`apps/web/src/components/activities/category-icons.tsx`, jadi menambah kategori cukup diikuti
dengan menaruh berkas `<id>.webp`; tidak ada daftar kedua yang bisa ketinggalan. Ajakan lama
yang menyimpan id kategori lama tetap mendapat sampul yang masuk akal karena idnya dipetakan
lewat `normalizeActivityCategoryId`.

Ketentuannya sama seperti ilustrasi onboarding: WebP, rasio tepat 16:9 supaya pas dengan wadah
`aspect-[16/9]` tanpa terpotong, dan dikecilkan ke lebar 1200 piksel sebelum dipakai.
