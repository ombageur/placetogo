import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import type { NotificationStore } from '../modules/notifications/store.js';

export function registerNotificationRoutes(
  app: FastifyInstance,
  deps: {
    requireAuth: preHandlerHookHandler;
    notifications: NotificationStore;
  },
) {
  const { requireAuth, notifications } = deps;

  // GET /v1/notifications (Daftar notifikasi & unread count)
  app.get('/v1/notifications', { preHandler: requireAuth }, async (req) => {
    return notifications.list(req.user!.uid);
  });

  // PATCH /v1/notifications/:id/read (Tandai 1 notifikasi telah dibaca)
  app.patch('/v1/notifications/:id/read', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const success = await notifications.markAsRead(req.user!.uid, id);
    if (!success) {
      return reply.code(404).send({ error: 'not_found', message: 'Notifikasi tidak ditemukan.' });
    }
    return { ok: true };
  });

  // POST /v1/notifications/read-all (Tandai semua notifikasi telah dibaca)
  app.post('/v1/notifications/read-all', { preHandler: requireAuth }, async (req) => {
    const count = await notifications.markAllAsRead(req.user!.uid);
    return { ok: true, updatedCount: count };
  });
}
