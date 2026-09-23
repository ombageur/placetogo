import { CITY_CATALOG, type CityId } from '@placetogo/shared';

/**
 * Kota aktif dipilih di satu tempat saja: pemilih kota pada header aplikasi.
 * Halaman lain tidak menampilkan kontrol kota sendiri, melainkan mengikuti pilihan itu.
 *
 * Header menyimpannya di localStorage lalu menyiarkan CITY_CHANGE_EVENT pada window,
 * sehingga halaman yang sedang terbuka bisa ikut menyesuaikan tanpa perlu dimuat ulang.
 * Kunci dan nama event diletakkan di sini agar kedua sisi tidak memakai string yang berbeda.
 */
export const HEADER_CITY_KEY = 'placetogo_selected_city';
export const CITY_CHANGE_EVENT = 'cityChange';

export type CityChangeDetail = { cityId?: string };

/** Mengembalikan id kota yang sah, atau undefined bila nilainya tidak dikenali. */
export function parseCityId(value: string | null | undefined): CityId | undefined {
  return CITY_CATALOG.find((city) => city.id === value)?.id;
}

/** Membaca kota tersimpan. Aman dipanggil saat localStorage diblokir. */
export function readStoredCity(): CityId | undefined {
  try {
    return parseCityId(window.localStorage.getItem(HEADER_CITY_KEY));
  } catch {
    return undefined;
  }
}
