import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { fieldErrors, profileInputSchema } from '@placetogo/shared';
import type { ProfileStore } from '../modules/profile/store.js';

export function registerProfileRoutes(
  app: FastifyInstance,
  deps: { requireAuth: preHandlerHookHandler; requireVerified: preHandlerHookHandler; profiles: ProfileStore },
) {
  const { requireAuth, requireVerified, profiles } = deps;

  // Hanya pemilik: identitas selalu dari token, tidak ada rute untuk membaca profil pengguna lain di sini.
  app.get(
    '/v1/me/profile',
    { preHandler: requireAuth, config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const profile = await profiles.get(req.user!.uid);
      if (!profile) return reply.code(404).send({ error: 'profile_not_found', message: 'Profil belum diisi.' });
      return profile;
    },
  );

  // Mensyaratkan email terverifikasi: sejalan dengan urutan tahap akun (verify_email -> profile_incomplete).
  app.put(
    '/v1/me/profile',
    { preHandler: [requireAuth, requireVerified], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = profileInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'validation_error',
          message: 'Data profil tidak valid.',
          fields: fieldErrors(parsed.error.issues),
        });
      }
      return profiles.save(req.user!.uid, parsed.data);
    },
  );
}
