import { AVATAR_IDS, type AvatarId } from '@placetogo/shared';

/**
 * Berkas ilustrasi untuk tiap avatar resmi, ada di `apps/web/public/avatars/`.
 *
 * Dipetakan dari AVATAR_IDS, sehingga menambah atau mengganti avatar di katalog bersama
 * cukup diikuti dengan menaruh berkas `<id>.png`; tidak ada daftar kedua yang bisa
 * ketinggalan diperbarui.
 */
export const AVATAR_IMAGE_SRC = Object.fromEntries(
  AVATAR_IDS.map((id) => [id, `/avatars/${id}.webp`]),
) as Record<AvatarId, string>;

/** Ukuran asli tiap berkas avatar, dipakai next/image untuk mencegah pergeseran tata letak. */
export const AVATAR_IMAGE_SIZE = 312;
