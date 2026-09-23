import type { PlaceDetails, PlaceSuggestion } from '@placetogo/shared';

/**
 * Kontrak Google Places API (New). Backend memproksi semua panggilan Places (kunci server
 * tidak pernah dikirim ke browser); kunci browser hanya dipakai memuat Maps JavaScript API
 * untuk peta interaktif (lihat apps/web/src/lib/maps). Hanya Place ID yang boleh disimpan
 * jangka panjang di dokumen aktivitas; detail tempat lain (nama, alamat, koordinat) dipakai
 * saat itu juga untuk ditampilkan/disimpan pada aktivitas, tidak di-cache terpisah lebih
 * lama dari yang diizinkan kebijakan Google Maps Platform (lihat docs/discovery/nearby.md).
 *
 * `PlaceSuggestion`/`PlaceDetails` didefinisikan di packages/shared (dipakai bersama web).
 */
export type { PlaceDetails, PlaceSuggestion };

export interface PlacesGateway {
  /**
   * `sessionToken`: dibuat KLIEN sekali per sesi pencarian (mulai mengetik sampai memilih
   * tempat atau membatalkan), sama untuk setiap panggilan autocomplete + getPlace berikutnya
   * dalam sesi itu, lalu dibuang. Mengelompokkan billing Google jadi satu sesi, bukan per
   * permintaan — wajib disertakan, bukan opsional.
   */
  autocomplete(input: string, sessionToken: string): Promise<PlaceSuggestion[]>;
  getPlace(placeId: string, sessionToken: string): Promise<PlaceDetails>;
}

const NOT_CONFIGURED_MESSAGE = 'Pencarian tempat belum dikonfigurasi di server ini.';

export const notConfiguredPlacesGateway: PlacesGateway = {
  async autocomplete() {
    throw new Error(NOT_CONFIGURED_MESSAGE);
  },
  async getPlace() {
    throw new Error(NOT_CONFIGURED_MESSAGE);
  },
};

/** Untuk tes unit rute tanpa memanggil Google sungguhan. */
export function createFakePlacesGateway(): PlacesGateway & { calls: { autocomplete: number; getPlace: number } } {
  const calls = { autocomplete: 0, getPlace: 0 };
  return {
    calls,
    async autocomplete(input, sessionToken) {
      calls.autocomplete++;
      if (!sessionToken) throw new Error('sessionToken wajib diisi');
      return [{ placeId: 'fake-place-1', primaryText: `Hasil untuk "${input}"`, secondaryText: 'Jakarta, Indonesia' }];
    },
    async getPlace(placeId, sessionToken) {
      calls.getPlace++;
      if (!sessionToken) throw new Error('sessionToken wajib diisi');
      return { placeId, name: 'Tempat Contoh', formattedAddress: 'Jl. Contoh No. 1, Jakarta', lat: -6.2, lng: 106.8 };
    },
  };
}
