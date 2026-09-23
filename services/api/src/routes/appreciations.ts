import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { sendAppreciationInputSchema } from '@placetogo/shared';
import type { AppreciationStore } from '../modules/appreciations/store.js';
import { InsufficientBalanceError } from '../modules/wallet/store.js';

export function registerAppreciationRoutes(
  app: FastifyInstance,
  deps: {
    requireAuth: preHandlerHookHandler;
    requireVerified: preHandlerHookHandler;
    appreciations: AppreciationStore;
  },
) {
  const { requireAuth, requireVerified, appreciations } = deps;
  const auth = [requireAuth, requireVerified];

  app.post(
    '/v1/appreciations',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = sendAppreciationInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation_error', message: 'Data apresiasi tidak valid.' });
      }

      if (parsed.data.toUid === req.user!.uid) {
        return reply.code(400).send({ error: 'self_appreciation', message: 'Tidak dapat mengirim apresiasi ke diri sendiri.' });
      }

      try {
        const doc = await appreciations.send(req.user!.uid, parsed.data);
        return reply.code(201).send(doc);
      } catch (err) {
        // Saldo kurang adalah keadaan yang wajar terjadi, bukan kegagalan server:
        // pengirim perlu tahu alasannya, bukan menerima galat 500 tanpa penjelasan.
        if (err instanceof InsufficientBalanceError) {
          return reply.code(409).send({
            error: 'insufficient_balance',
            message: 'Saldo Coin kamu tidak cukup untuk mengirim apresiasi ini.',
          });
        }
        throw err;
      }
    },
  );

  /** Hadiah yang diterima pengguna yang sedang masuk, untuk halaman Hadiah. */
  app.get('/v1/appreciations/received', { preHandler: auth }, async (req) => {
    const items = await appreciations.listReceived(req.user!.uid);
    return {
      items,
      totalCoins: items.reduce((sum, item) => sum + item.amount, 0),
    };
  });

  app.get('/v1/appreciations/activity/:activityId', { preHandler: auth }, async (req) => {
    const { activityId } = req.params as { activityId: string };
    return appreciations.listByActivity(activityId, req.user!.uid);
  });
}
