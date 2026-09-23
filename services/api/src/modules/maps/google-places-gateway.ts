import { z } from 'zod';
import type { PlaceDetails, PlacesGateway, PlaceSuggestion } from './contract.js';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

/**
 * Implementasi sungguhan Places API (New) lewat REST + fetch. Field mask dijaga minimal
 * (Basic Data saja: id, nama, alamat, lokasi) untuk menekan biaya — lihat
 * docs/discovery/nearby.md untuk rincian field mask dan kebijakan penyimpanan.
 *
 * PENTING: bentuk request/response di sini mengikuti dokumentasi resmi Places API (New)
 * per penulisan kode ini, TAPI belum pernah diuji terhadap API sungguhan (butuh kunci
 * server asli). Jangan anggap sudah terverifikasi produksi sebelum ada bukti pengujian
 * nyata (lihat laporan fase).
 */
export function createGooglePlacesGateway(apiKey: string): PlacesGateway {
  async function callPlaces<T>(path: string, init: RequestInit & { fieldMask: string }): Promise<T> {
    const { fieldMask, headers, ...rest } = init;
    const res = await fetch(`${PLACES_API_BASE}${path}`, {
      ...rest,
      headers: {
        ...headers,
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
        'content-type': 'application/json',
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Places API ${path} gagal: HTTP ${res.status} ${body.slice(0, 300)}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    async autocomplete(input, sessionToken) {
      const suggestionSchema = z.object({
        suggestions: z
          .array(
            z.object({
              placePrediction: z.object({
                placeId: z.string(),
                structuredFormat: z.object({
                  mainText: z.object({ text: z.string() }),
                  secondaryText: z.object({ text: z.string() }).optional(),
                }),
              }),
            }),
          )
          .default([]),
      });

      const data = await callPlaces<unknown>('/places:autocomplete', {
        method: 'POST',
        // Field mask untuk autocomplete dikendalikan lewat body (bukan header) di endpoint ini.
        fieldMask: '*',
        body: JSON.stringify({
          input,
          sessionToken,
          languageCode: 'id',
          regionCode: 'ID',
        }),
      });
      const parsed = suggestionSchema.parse(data);
      return parsed.suggestions.map(
        (s): PlaceSuggestion => ({
          placeId: s.placePrediction.placeId,
          primaryText: s.placePrediction.structuredFormat.mainText.text,
          secondaryText: s.placePrediction.structuredFormat.secondaryText?.text,
        }),
      );
    },

    async getPlace(placeId, sessionToken): Promise<PlaceDetails> {
      const detailsSchema = z.object({
        id: z.string(),
        displayName: z.object({ text: z.string() }),
        formattedAddress: z.string().optional(),
        location: z.object({ latitude: z.number(), longitude: z.number() }),
      });

      const data = await callPlaces<unknown>(`/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`, {
        method: 'GET',
        fieldMask: 'id,displayName,formattedAddress,location',
      });
      const parsed = detailsSchema.parse(data);
      return {
        placeId: parsed.id,
        name: parsed.displayName.text,
        formattedAddress: parsed.formattedAddress,
        lat: parsed.location.latitude,
        lng: parsed.location.longitude,
      };
    },
  };
}
