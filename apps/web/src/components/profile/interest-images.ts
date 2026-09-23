import { INTEREST_IDS, type InterestId } from '@placetogo/shared';

/**
 * Berkas ikon untuk tiap minat resmi, ada di `apps/web/public/interests/`.
 *
 * Dipetakan dari INTEREST_IDS agar tidak ada daftar kedua yang bisa ketinggalan
 * diperbarui: menambah minat di katalog bersama cukup diikuti dengan menaruh `<id>.webp`.
 */
export const INTEREST_IMAGE_SRC = Object.fromEntries(
  INTEREST_IDS.map((id) => [id, `/interests/${id}.webp`]),
) as Record<InterestId, string>;

/** Ukuran asli tiap berkas ikon, dipakai next/image untuk mencegah pergeseran tata letak. */
export const INTEREST_IMAGE_SIZE = 256;
