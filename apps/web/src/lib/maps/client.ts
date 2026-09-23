import { z } from 'zod';
import { placeDetailsSchema, placeSuggestionSchema, type PlaceDetails, type PlaceSuggestion } from '@placetogo/shared';
import { apiFetch } from '@/lib/api';

/**
 * Memanggil rute Places di BACKEND kita (bukan Google langsung) — kunci server Places
 * tidak pernah ada di browser. `sessionToken`: lihat lib/maps/session-token.ts.
 */
export async function searchPlaces(input: string, sessionToken: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const qs = new URLSearchParams({ input: trimmed, sessionToken }).toString();
  const data = await apiFetch(`/v1/places/autocomplete?${qs}`, 'GET');
  return z.array(placeSuggestionSchema).parse(data);
}

export async function getPlaceDetails(placeId: string, sessionToken: string): Promise<PlaceDetails> {
  const qs = new URLSearchParams({ sessionToken }).toString();
  const data = await apiFetch(`/v1/places/${encodeURIComponent(placeId)}?${qs}`, 'GET');
  return placeDetailsSchema.parse(data);
}
