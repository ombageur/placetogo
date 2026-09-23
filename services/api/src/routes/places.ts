import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { z } from 'zod';
import type { PlacesGateway } from '../modules/maps/contract.js';

const sessionTokenSchema = z.string().min(1).max(100);
const autocompleteQuerySchema = z.object({
  input: z.string().trim().min(1).max(200),
  sessionToken: sessionTokenSchema,
});
const placeParamsSchema = z.object({ placeId: z.string().min(1).max(300) });
const placeQuerySchema = z.object({ sessionToken: sessionTokenSchema });

/**
 * Proksi Places API (New): klien tidak pernah memanggil Google langsung untuk pencarian
 * tempat, hanya lewat sini (kunci server tidak terpapar). Peta interaktif (Maps JavaScript
 * API) adalah hal terpisah yang JS-nya dimuat langsung di browser dengan kunci browser
 * terbatas — lihat apps/web/src/lib/maps.
 */
export function registerPlacesRoutes(app: FastifyInstance, deps: { requireAuth: preHandlerHookHandler; places: PlacesGateway }) {
  const { requireAuth, places } = deps;

  app.get(
    '/v1/places/autocomplete',
    { preHandler: requireAuth, config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = autocompleteQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation_error', message: 'Parameter pencarian tidak valid.' });
      }
      try {
        return await places.autocomplete(parsed.data.input, parsed.data.sessionToken);
      } catch (err) {
        req.log.warn({ err }, 'places autocomplete gagal');
        return reply.code(502).send({ error: 'places_unavailable', message: 'Pencarian tempat sedang tidak tersedia.' });
      }
    },
  );

  app.get(
    '/v1/places/:placeId',
    { preHandler: requireAuth, config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const params = placeParamsSchema.safeParse(req.params);
      const qs = placeQuerySchema.safeParse(req.query);
      if (!params.success || !qs.success) {
        return reply.code(400).send({ error: 'validation_error', message: 'Parameter tidak valid.' });
      }
      try {
        return await places.getPlace(params.data.placeId, qs.data.sessionToken);
      } catch (err) {
        req.log.warn({ err }, 'places getPlace gagal');
        return reply.code(502).send({ error: 'places_unavailable', message: 'Detail tempat sedang tidak tersedia.' });
      }
    },
  );
}
