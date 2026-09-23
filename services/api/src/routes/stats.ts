import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import type { ProfileStats } from '@placetogo/shared';
import type { ActivityStore } from '../modules/activities/store.js';
import type { AppreciationStore } from '../modules/appreciations/store.js';

/**
 * Ringkasan angka untuk halaman profil.
 *
 * Dikumpulkan di backend, bukan di klien, karena sumbernya tersebar: ajakan ada di koleksi
 * `activities`, check-in ada di subkoleksi tiap ajakan, dan hadiah ada di koleksi
 * `appreciations`. Security Rules juga tidak mengizinkan klien membaca ketiganya secara luas.
 *
 * Sebelumnya halaman profil menampilkan angka tetap (12 pertemuan, 5 ajakan) untuk semua
 * pengguna, sehingga tidak berarti apa-apa.
 */
export function registerStatsRoutes(
  app: FastifyInstance,
  deps: {
    requireAuth: preHandlerHookHandler;
    requireVerified: preHandlerHookHandler;
    activities: ActivityStore;
    appreciations: AppreciationStore;
  },
) {
  const { requireAuth, requireVerified, activities, appreciations } = deps;

  app.get(
    '/v1/me/stats',
    { preHandler: [requireAuth, requireVerified], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (req): Promise<ProfileStats> => {
      const uid = req.user!.uid;
      const [created, meetings, gifts] = await Promise.all([
        activities.listByCreator(uid),
        activities.countCheckins(uid),
        appreciations.listReceived(uid),
      ]);

      return {
        meetings,
        activities: created.length,
        giftsReceived: gifts.length,
        giftCoins: gifts.reduce((sum, gift) => sum + gift.amount, 0),
      };
    },
  );
}
