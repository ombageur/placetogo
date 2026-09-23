import type { FastifyInstance, FastifyReply, preHandlerHookHandler } from 'fastify';
import { createActivityInputSchema, updateActivityCapacitySchema } from '@placetogo/shared';
import type { ActivityStore } from '../modules/activities/store.js';
import {
  ActivityAlreadyStartedError,
  ActivityFullError,
  ActivityNotFoundError,
  AlreadyJoinedError,
  CapacityBelowParticipantsError,
  ForbiddenActivityActionError,
  InvalidActivityStateError,
  NotJoinedError,
  SelfJoinError,
} from '../modules/activities/errors.js';

const ERROR_MESSAGES: Record<string, string> = {
  activity_not_found: 'Ajakan tidak ditemukan.',
  forbidden: 'Kamu tidak berwenang melakukan ini.',
  invalid_state: 'Ajakan sedang tidak dalam status yang sesuai untuk aksi ini.',
  activity_full: 'Ajakan ini sudah penuh.',
  already_joined: 'Kamu sudah bergabung di ajakan ini.',
  self_join: 'Kamu tidak dapat bergabung dengan ajakanmu sendiri.',
  already_started: 'Ajakan ini sudah dimulai, tidak bisa lagi bergabung.',
  not_joined: 'Kamu belum bergabung di ajakan ini.',
  capacity_below_participants: 'Kapasitas tidak boleh kurang dari jumlah peserta saat ini.',
};

/** Memetakan galat domain ke status HTTP + kode error yang konsisten, tanpa membocorkan detail internal. */
function handleActivityError(err: unknown, reply: FastifyReply) {
  const map: Array<[new (...a: never[]) => Error, number, string]> = [
    [ActivityNotFoundError, 404, 'activity_not_found'],
    [ForbiddenActivityActionError, 403, 'forbidden'],
    [InvalidActivityStateError, 409, 'invalid_state'],
    [ActivityFullError, 409, 'activity_full'],
    [AlreadyJoinedError, 409, 'already_joined'],
    [SelfJoinError, 400, 'self_join'],
    [ActivityAlreadyStartedError, 409, 'already_started'],
    [NotJoinedError, 404, 'not_joined'],
    [CapacityBelowParticipantsError, 400, 'capacity_below_participants'],
  ];
  for (const [ErrClass, status, code] of map) {
    if (err instanceof ErrClass) return reply.code(status).send({ error: code, message: ERROR_MESSAGES[code] });
  }
  throw err; // tak dikenal: biar errorHandler global yang menangani (500 generik)
}

export function registerActivityRoutes(
  app: FastifyInstance,
  deps: { requireAuth: preHandlerHookHandler; requireVerified: preHandlerHookHandler; activities: ActivityStore },
) {
  const { requireAuth, requireVerified, activities } = deps;
  const auth = [requireAuth, requireVerified];

  /** Ajakan yang dibuat pengguna yang sedang masuk, untuk halaman "Ajakan Saya". */
  app.get('/v1/me/activities', { preHandler: auth }, async (req) => {
    const items = await activities.listByCreator(req.user!.uid);
    return { items };
  });

  app.post(
    '/v1/activities',
    { preHandler: auth, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = createActivityInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation_error', message: 'Data ajakan tidak valid.' });
      }
      const activity = await activities.create(req.user!.uid, parsed.data);
      return reply.code(201).send(activity);
    },
  );

  app.post(
    '/v1/activities/:id/publish',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        return await activities.publish(id, req.user!.uid);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.post(
    '/v1/activities/:id/cancel',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        return await activities.cancel(id, req.user!.uid);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.post(
    '/v1/activities/:id/start',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        return await activities.start(id, req.user!.uid);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.post(
    '/v1/activities/:id/complete',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        return await activities.complete(id, req.user!.uid);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.patch(
    '/v1/activities/:id/capacity',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = updateActivityCapacitySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation_error', message: 'Kapasitas tidak valid.' });
      }
      try {
        return await activities.updateCapacity(id, req.user!.uid, parsed.data.capacity);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.post(
    '/v1/activities/:id/join-requests',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        return await activities.join(id, req.user!.uid);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.delete(
    '/v1/activities/:id/join-requests/me',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        return await activities.leave(id, req.user!.uid);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.post(
    '/v1/activities/:id/checkin',
    { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        return await activities.checkin(id, req.user!.uid);
      } catch (err) {
        return handleActivityError(err, reply);
      }
    },
  );

  app.get(
    '/v1/activities/:id/checkin',
    { preHandler: auth },
    async (req) => {
      const { id } = req.params as { id: string };
      return activities.getCheckin(id, req.user!.uid);
    },
  );
}

