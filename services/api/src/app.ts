import type { Writable } from 'node:stream';
import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { Env } from './config/env.js';
import { registerHealthRoutes, type ReadinessCheck } from './routes/health.js';
import { registerMeRoutes } from './routes/me.js';
import { registerProfileRoutes } from './routes/profile.js';
import { registerPlacesRoutes } from './routes/places.js';
import { registerActivityRoutes } from './routes/activities.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerAppreciationRoutes } from './routes/appreciations.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerWalletRoutes } from './routes/wallet.js';
import { registerPaymentRoutes } from './routes/payments.js';
import { registerNotificationRoutes } from './routes/notifications.js';
import { registerReportRoutes } from './routes/reports.js';
import {
  createRequireAuth,
  requireAdmin,
  requireVerifiedEmail,
  type TokenVerifier,
} from './middleware/auth.js';
import type { AccountStore } from './modules/accounts/store.js';
import type { ProfileStore } from './modules/profile/store.js';
import type { PlacesGateway } from './modules/maps/contract.js';
import type { ActivityStore } from './modules/activities/store.js';
import type { ChatStore } from './modules/chat/store.js';
import type { AppreciationStore } from './modules/appreciations/store.js';
import type { WalletStore } from './modules/wallet/store.js';
import type { PaymentGateway } from './modules/doku/contract.js';
import type { NotificationStore } from './modules/notifications/store.js';
import type { ReportStore } from './modules/reports/store.js';

export interface AppDeps {
  env: Pick<Env, 'LOG_LEVEL' | 'WEB_ORIGIN'> & { RATE_LIMIT_ALLOWLIST?: string[] };
  verifyToken: TokenVerifier;
  accounts: AccountStore;
  profiles: ProfileStore;
  places: PlacesGateway;
  activities: ActivityStore;
  chat: ChatStore;
  appreciations: AppreciationStore;
  wallet: WalletStore;
  doku: PaymentGateway;
  notifications: NotificationStore;
  reports: ReportStore;
  readiness: Record<string, ReadinessCheck>;
  /** Hanya untuk tes: menangkap keluaran log. */
  logStream?: Writable;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: deps.env.LOG_LEVEL,
      // Jangan pernah mencatat kredensial, token, atau kata sandi.
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'req.body.password',
        'req.body.idToken',
      ],
      ...(deps.logStream ? { stream: deps.logStream } : {}),
    },
    bodyLimit: 100 * 1024,
    trustProxy: true, // di belakang Cloud Run / Google Front End
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: deps.env.WEB_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type'],
  });
  // Batas global per IP; rute sensitif menimpa dengan batas lebih ketat (routes/me.ts).
  // Store in-memory per instance: strategi terdistribusi dinilai di Fase 11.
  await app.register(rateLimit, {
    global: true,
    allowList: deps.env.RATE_LIMIT_ALLOWLIST ?? [],
    max: 120,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      error: 'too_many_requests',
      message: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(ctx.ttl / 1000)} detik.`,
    }),
  });

  // Pesan galat aman: detail internal tidak pernah dikirim ke klien.
  app.setErrorHandler((err, req, reply) => {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    if (status === 429) return reply.code(429).send(err);
    return reply
      .code(status >= 500 ? 500 : status)
      .send({ error: status >= 500 ? 'internal' : 'bad_request', message: status >= 500 ? 'Terjadi kesalahan pada server.' : 'Permintaan tidak valid.' });
  });
  app.setNotFoundHandler((_req, reply) =>
    reply.code(404).send({ error: 'not_found', message: 'Tidak ditemukan.' }),
  );

  registerHealthRoutes(app, deps.readiness);

  const requireAuth = createRequireAuth(deps.verifyToken);
  registerMeRoutes(app, { requireAuth, requireVerified: requireVerifiedEmail, accounts: deps.accounts });
  registerProfileRoutes(app, { requireAuth, requireVerified: requireVerifiedEmail, profiles: deps.profiles });
  registerPlacesRoutes(app, { requireAuth, places: deps.places });
  registerActivityRoutes(app, { requireAuth, requireVerified: requireVerifiedEmail, activities: deps.activities });
  registerChatRoutes(app, { requireAuth, requireVerified: requireVerifiedEmail, chat: deps.chat, profiles: deps.profiles });
  registerAppreciationRoutes(app, { requireAuth, requireVerified: requireVerifiedEmail, appreciations: deps.appreciations });
  registerStatsRoutes(app, {
    requireAuth,
    requireVerified: requireVerifiedEmail,
    activities: deps.activities,
    appreciations: deps.appreciations,
  });
  registerWalletRoutes(app, { requireAuth, requireVerified: requireVerifiedEmail, wallet: deps.wallet });
  registerPaymentRoutes(app, { requireAuth, wallet: deps.wallet, doku: deps.doku });
  registerNotificationRoutes(app, { requireAuth, notifications: deps.notifications });
  registerReportRoutes(app, { requireAuth, requireAdmin, reports: deps.reports });
  // Kontrak fondasi RBAC: pengguna biasa tidak dapat membuka endpoint admin.
  app.get('/v1/admin/ping', { preHandler: [requireAuth, requireAdmin] }, async () => ({ ok: true }));

  return app;
}


