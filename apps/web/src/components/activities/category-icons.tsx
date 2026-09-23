import {
  ACTIVITY_CATEGORY_IDS,
  normalizeActivityCategoryId,
  type ActivityCategoryId,
} from '@placetogo/shared';

export const CATEGORY_IMAGE_SRC: Record<ActivityCategoryId, string> = {
  ngobrol: '/interests/ngobrol.webp',
  olahraga: '/interests/olahraga.webp',
  film: '/interests/film.webp',
  seni: '/interests/seni.webp',
  karier: '/interests/karier.webp',
  komunitas: '/interests/komunitas.webp',
  pertemanan: '/interests/pertemanan.webp',
  kuliner: '/interests/kuliner.webp',
  video: '/interests/video.webp',
  buku: '/interests/buku.webp',
  relawan: '/interests/relawan.webp',
  hewan: '/interests/hewan.webp',
};

/**
 * Foto sampul halaman detail ajakan: satu ilustrasi per kategori, rasio 16:9.
 *
 * Diturunkan dari ACTIVITY_CATEGORY_IDS agar tidak ada daftar kedua yang bisa ketinggalan
 * diperbarui; menambah kategori cukup diikuti dengan menaruh `<id>.webp` di public/covers/.
 */
export const ACTIVITY_COVER_SRC = Object.fromEntries(
  ACTIVITY_CATEGORY_IDS.map((id) => [id, `/covers/${id}.webp`]),
) as Record<ActivityCategoryId, string>;

/** Ukuran asli foto sampul, dipakai next/image agar rasionya tepat. */
export const ACTIVITY_COVER_SIZE = { width: 1200, height: 675 };

/**
 * Sampul untuk sebuah kategori. Id kategori lama ikut dipetakan lewat
 * normalizeActivityCategoryId, sehingga ajakan lama tetap mendapat sampul yang masuk akal.
 */
export function getActivityCoverImage(id?: string | null): string {
  return ACTIVITY_COVER_SRC[normalizeActivityCategoryId(id)];
}

export function getCategoryOrInterestImage(id?: string | null): string {
  if (!id) return '/interests/ngobrol.webp';
  const normalizedId = normalizeActivityCategoryId(id);
  if (normalizedId in CATEGORY_IMAGE_SRC) {
    return CATEGORY_IMAGE_SRC[normalizedId];
  }
  return `/interests/${normalizedId}.webp`;
}

export const CATEGORY_FA_ICONS: Record<ActivityCategoryId, string> = {
  ngobrol: 'fa-solid fa-comments',
  olahraga: 'fa-solid fa-dumbbell',
  film: 'fa-solid fa-film',
  seni: 'fa-solid fa-palette',
  karier: 'fa-solid fa-briefcase',
  komunitas: 'fa-solid fa-users',
  pertemanan: 'fa-solid fa-handshake',
  kuliner: 'fa-solid fa-utensils',
  video: 'fa-solid fa-video',
  buku: 'fa-solid fa-book-open',
  relawan: 'fa-solid fa-hand-holding-heart',
  hewan: 'fa-solid fa-paw',
};

