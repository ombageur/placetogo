# Avatar

Aplikasi memakai dua belas avatar ilustrasi, bukan foto. Pilihan ini disengaja: onboarding
menyatakan "Gunakan avatar, bukan foto", sehingga pengguna tidak perlu memasang wajahnya sendiri.

## Berkas

x`. Semuanya dipotong dari satu lembar ilustrasi 3×4 yang
diberikan, dengan batas sel ditentukan lewat profil alpha per kolom dan baris, bukan ditebak.

| Id | Label | Id | Label |
| --- | --- | --- | --- |
| `cat` | Kucing | `frog` | Katak |
| `bear` | Beruang | `raccoon` | Rakun |
| `fox` | Rubah | `koala` | Koala |
| `owl` | Burung Hantu | `penguin` | Pinguin |
| `parrot` | Burung Beo | `rabbit` | Kelinci |
| `panda` | Panda | `pig` | Babi |

Urutannya sengaja mengikuti lembar sumber (kiri ke kanan, atas ke bawah), sehingga grid pemilihan
avatar tampil dengan susunan yang sama seperti lembar aslinya.

## Cara kerjanya di kode

`AVATAR_CATALOG` di `packages/shared/src/constants/catalog.ts` adalah sumber kebenaran untuk id dan
labelnya, dipakai bersama oleh klien dan server (skema Zod memvalidasi `avatarId` terhadap daftar
ini). `apps/web/src/components/profile/avatar-images.ts` menurunkan peta berkasnya langsung dari
`AVATAR_IDS`, jadi tidak ada daftar kedua yang bisa ketinggalan diperbarui: menambah avatar cukup
dengan menambah entri katalog lalu menaruh `<id>.webp`.

Tiga tempat merendernya: `Avatar` (dipakai di mana-mana), `AvatarPicker` (form profil), dan layar
onboarding pemilihan avatar. Ketiganya memakai `next/image` sehingga berkas 312 px disajikan dalam
ukuran yang sesuai tempat tampilnya.

## Catatan perubahan

Sebelumnya avatar berupa dua belas glif SVG satu warna hijau di
`apps/web/src/components/profile/avatar-icons.tsx`. Berkas itu dihapus ketika ilustrasi berwarna
masuk. Lima id lama yang bukan hewan — `robot`, `alien`, `plant`, `coffee`, `book` — diganti menjadi
`parrot`, `frog`, `raccoon`, `penguin`, `pig` mengikuti isi lembar ilustrasi.

Penggantian id itu berpengaruh pada data: profil yang tersimpan dengan salah satu id lama tidak akan
lolos validasi saat profilnya disimpan ulang. Saat penggantian dilakukan tidak ada profil semacam itu
di emulator, dan belum ada basis data produksi. Bila nanti sudah ada, perlu migrasi yang memetakan
kelima id lama ke avatar pengganti.
