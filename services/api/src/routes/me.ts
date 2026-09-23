import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { resolveAccountStage, type AccountState } from '@placetogo/shared';
import type { AccountStore } from '../modules/accounts/store.js';

/**
 * Rute akun. Semua rute memakai requireAuth; identitas selalu berasal dari token yang
 * diverifikasi server, tidak pernah dari body/query.
 */
export function registerMeRoutes(
  app: FastifyInstance,
  deps: { requireAuth: preHandlerHookHandler; requireVerified: preHandlerHookHandler; accounts: AccountStore },
) {
  const { requireAuth, requireVerified, accounts } = deps;

  const stateOf = (
    user: { uid: string; emailVerified: boolean },
    record: { profileComplete: boolean } | null,
  ): AccountState => {
    const profileComplete = record?.profileComplete ?? false;
    return {
      uid: user.uid,
      emailVerified: user.emailVerified,
      initialized: record !== null,
      profileComplete,
      stage: resolveAccountStage({ emailVerified: user.emailVerified, profileComplete }),
    };
  };

  // Tanpa efek samping: kondisi akun saat ini.
  app.get(
    '/v1/me',
    { preHandler: requireAuth, config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (req) => {
      const user = req.user!;
      return stateOf(user, await accounts.get(user.uid));
    },
  );

  // Idempoten: membuat user_private awal. Batas ketat karena normalnya dipanggil sekali per akun.
  app.post(
    '/v1/me/init',
    { preHandler: requireAuth, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req) => {
      const user = req.user!;
      return stateOf(user, await accounts.ensure(user.uid));
    },
  );

  // Kontrak fondasi: contoh endpoint yang mewajibkan email terverifikasi.
  app.get('/v1/verified/ping', { preHandler: [requireAuth, requireVerified] }, async (req) => ({
    ok: true,
    uid: req.user?.uid,
  }));
}
