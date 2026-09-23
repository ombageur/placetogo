import type { FastifyInstance, FastifyReply, preHandlerHookHandler } from 'fastify';
import { sendMessageInputSchema } from '@placetogo/shared';
import type { ChatStore } from '../modules/chat/store.js';
import type { ProfileStore } from '../modules/profile/store.js';
import { ConversationNotFoundError, ForbiddenConversationActionError } from '../modules/chat/errors.js';

function handleChatError(err: unknown, reply: FastifyReply) {
  if (err instanceof ConversationNotFoundError) {
    return reply.code(404).send({ error: 'conversation_not_found', message: 'Percakapan tidak ditemukan.' });
  }
  if (err instanceof ForbiddenConversationActionError) {
    return reply.code(403).send({ error: 'forbidden', message: 'Kamu bukan anggota percakapan ini.' });
  }
  throw err;
}

export function registerChatRoutes(
  app: FastifyInstance,
  deps: {
    requireAuth: preHandlerHookHandler;
    requireVerified: preHandlerHookHandler;
    chat: ChatStore;
    profiles: ProfileStore;
  },
) {
  const { requireAuth, requireVerified, chat, profiles } = deps;
  const auth = [requireAuth, requireVerified];

  app.get('/v1/conversations', { preHandler: auth }, async (req) => {
    return chat.listUserConversations(req.user!.uid);
  });

  app.get('/v1/conversations/:id', { preHandler: auth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      return await chat.getConversation(id, req.user!.uid);
    } catch (err) {
      return handleChatError(err, reply);
    }
  });

  app.get('/v1/conversations/activity/:activityId', { preHandler: auth }, async (req, reply) => {
    const { activityId } = req.params as { activityId: string };
    try {
      return await chat.getOrCreateActivityConversation(activityId, req.user!.uid, 'Diskusi Ajakan');
    } catch (err) {
      return handleChatError(err, reply);
    }
  });

  app.post(
    '/v1/conversations/:id/messages',
    { preHandler: auth, config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = sendMessageInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'validation_error', message: 'Pesan tidak valid.' });
      }

      const uid = req.user!.uid;
      const profile = await profiles.get(uid);
      const senderName = profile?.displayName ?? 'Pengguna';
      const senderAvatarId = profile?.avatarId ?? 'cat';

      try {
        const msg = await chat.sendMessage(id, uid, senderName, senderAvatarId, parsed.data.body);
        return reply.code(201).send(msg);
      } catch (err) {
        return handleChatError(err, reply);
      }
    },
  );
}
