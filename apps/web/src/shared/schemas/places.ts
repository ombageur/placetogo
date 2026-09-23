import { z } from 'zod';

/**
 * Bentuk data Places dipakai bersama backend (proksi Places API New) dan web (menampilkan
 * hasil). Panggilan sungguhan ke Google TETAP hanya dari backend (lihat
 * services/api/src/modules/maps) — skema ini murni kontrak respons, bukan request Google.
 */

/** Hasil autocomplete: prediksi teks saja, BELUM ada koordinat (butuh getPlace terpisah). */
export const placeSuggestionSchema = z.object({
  placeId: z.string().min(1),
  primaryText: z.string().min(1),
  secondaryText: z.string().optional(),
});
export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;

/** Detail tempat terpilih, field mask minimal (Basic Data): id, nama, alamat, koordinat. */
export const placeDetailsSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  formattedAddress: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type PlaceDetails = z.infer<typeof placeDetailsSchema>;
