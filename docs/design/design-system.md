# Sistem desain dan navigasi (Fase 01)

Sumber kebenaran token: `apps/web/src/styles/globals.css` (blok `:root` + `@theme inline`).
Referensi visual: hijau tua `#174D3B`, hijau sekunder `#28664F`, mint `#E9F5EE`, latar putih,
sudut membulat, mobile-first.

## Token
| Kategori | Token |
|---|---|
| Merek | `primary #174D3B`, `secondary #28664F`, `mint #E9F5EE`, `mint-strong #D3EBDD`, `background #FFF` |
| Teks/garis | `foreground #12261F`, `muted-foreground #4F625A`, `border #D8E6DD`, `border-strong #6F8F7E` |
| Status | `danger`, `danger-soft`, `warning-soft`, `info-soft`, `neutral-soft` (pasangan teks/latar) |
| Dekoratif | `coin #F5B301` (bukan teks) |
| Tipografi | tumpukan font sistem (tanpa unduhan font/CDN); h1 24/28 bold, h2 18/24 bold, isi 16/24 |
| Spacing | skala Tailwind (kelipatan 4px) |
| Radius | tombol/badge pill, input `xl`, kartu `1.25rem`, modal `3xl` |
| Elevasi | `shadow-card`, `shadow-nav`, `shadow-modal` |
| Breakpoint | Tailwind bawaan + `xs = 430px`; nav bawah < 768px, rail ≥ 768px, sidebar penuh ≥ 1024px |

Kontras diuji otomatis (`src/styles/tokens.test.ts`): 15 pasangan teks ≥ 4.5:1 dan batas input ≥ 3:1.

## Komponen (`apps/web/src/components`)
`ui/`: Button (5 varian, `loading`), Input + TextField (label/hint/error via ARIA), Card, Avatar (inisial;
ilustrasi berlisensi di Fase 03), Badge, Modal (`<dialog>` native, bottom sheet di mobile), Skeleton/SkeletonList,
EmptyState/ErrorState, Toast (`ToastProvider`, `useToast`). `navigation/`: BottomNav, SideNav, `nav-items`.
`brand/`: Logo buatan sendiri (SVG inline). Ikon: `lucide-react` (ISC). Tidak ada aset pihak ketiga lain.

## Rute
`/` Beranda, `/jelajah`, `/buat`, `/chat`, `/profil` (kerangka; menyatakan fase fitur, tanpa data contoh
yang tampak seperti produksi), `/design-system` (galeri; 404 bila `NEXT_PUBLIC_APP_ENV=production`),
`not-found`, `error`, `manifest.webmanifest`.

## Aksesibilitas
Tautan "Lewati ke konten", `aria-current="page"`, indikator fokus 2px, target sentuh ≥ 44px, label pada setiap
input, wilayah live untuk toast (`alert` untuk galat), `prefers-reduced-motion`, safe-area di nav bawah,
`lang="id"`. Bukti: `pnpm test:e2e` (axe WCAG 2.0/2.1 A+AA, ukuran target, keyboard, modal, toast) dan
screenshot di `docs/design/screenshots/` (4 lebar × 6 rute + modal).

## Batasan yang diketahui
- axe otomatis hanya menangkap sebagian masalah a11y; uji manual dengan pembaca layar belum dilakukan.
- Dark mode tidak diimplementasikan (di luar lingkup referensi).
- PWA: manifest dan ikon SVG ada; service worker/offline dan ikon PNG 192/512 belum (belum diperlukan).
