import { normalizeActivityCategoryId, type InterestId } from '@placetogo/shared';

/**
 * Pemetaan resmi 12 Cover Ilustrasi untuk Detail Aktivitas
 * Berdasarkan 12 Minat Resmi PlaceToGo (INTEREST_CATALOG):
 *
 * 1. ngobrol     -> Ngobrol (/covers/pertemanan.jpg atau /covers/ngobrol.jpg)
 * 2. olahraga    -> Olahraga (/covers/olahraga.jpg)
 * 3. film        -> Film (/covers/film.jpg - Bioskop layar terbuka)
 * 4. seni        -> Seni & Kerajinan (/covers/seni.jpg - Workshop gerabah & melukis)
 * 5. karier      -> Karier & Bisnis (/covers/karier.jpg - Diskusi kerja & laptop di kafe)
 * 6. komunitas   -> Komunitas (/covers/komunitas.jpg - Kumpul lingkaran komunitas di kebun)
 * 7. pertemanan  -> Pertemanan (/covers/pertemanan.jpg - Jalan santai bersama di taman)
 * 8. kuliner     -> Kuliner (/covers/kuliner.jpg - Santap bersama tumpeng & sate)
 * 9. video       -> Video & Konten (/covers/video.jpg - Kreator & kamera konten makanan)
 * 10. buku       -> Buku (/covers/buku.jpg - Workshop floral & buku catatan)
 * 11. relawan    -> Relawan & Sosial (/covers/relawan.jpg - Aksi tanam pohon & kebun kota)
 * 12. hewan      -> Hewan Peliharaan (/covers/hewan.jpg - Piknik dengan anjing & kucing)
 */

export const OFFICIAL_COVER_MAP: Record<InterestId, string> = {
  ngobrol: '/covers/pertemanan.jpg',
  olahraga: '/covers/olahraga.jpg',
  film: '/covers/film.jpg',
  seni: '/covers/seni.jpg',
  karier: '/covers/karier.jpg',
  komunitas: '/covers/komunitas.jpg',
  pertemanan: '/covers/pertemanan.jpg',
  kuliner: '/covers/kuliner.jpg',
  video: '/covers/video.jpg',
  buku: '/covers/buku.jpg',
  relawan: '/covers/relawan.jpg',
  hewan: '/covers/hewan.jpg',
};

/** Alias / legacy category support */
export const ACTIVITY_COVER_IMAGES: Record<string, string> = {
  ...OFFICIAL_COVER_MAP,
  ngopi: '/covers/kuliner.jpg',
  makan: '/covers/kuliner.jpg',
  nonton: '/covers/film.jpg',
  'jalan-jalan': '/covers/pertemanan.jpg',
  belajar: '/covers/buku.jpg',
  hobi: '/covers/seni.jpg',
  profesional: '/covers/karier.jpg',
  dating: '/covers/pertemanan.jpg',
  kreator: '/covers/video.jpg',
  'aksi-sosial': '/covers/relawan.jpg',
};

/** Daftar cover yang berkasnya sudah tersedia di public/covers/ */
export const AVAILABLE_COVERS = new Set<string>([
  '/covers/kuliner.jpg',
  '/covers/video.jpg',
  '/covers/buku.jpg',
  '/covers/belajar.jpg',
  '/covers/relawan.jpg',
  '/covers/hewan.jpg',
  '/covers/film.jpg',
  '/covers/seni.jpg',
  '/covers/karier.jpg',
  '/covers/komunitas.jpg',
  '/covers/pertemanan.jpg',
]);

const DEFAULT_FALLBACK_COVER = '/covers/kuliner.jpg';

export function getActivityCoverImage(categoryId?: string): string {
  if (!categoryId) return DEFAULT_FALLBACK_COVER;
  const normalizedId = normalizeActivityCategoryId(categoryId);
  const target = OFFICIAL_COVER_MAP[normalizedId] || ACTIVITY_COVER_IMAGES[categoryId];
  if (target && AVAILABLE_COVERS.has(target)) {
    return target;
  }
  return DEFAULT_FALLBACK_COVER;
}

