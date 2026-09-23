import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import {
  createReportInputSchema,
  moderateReportInputSchema,
  type ReportStatus,
} from '@placetogo/shared';
import type { ReportStore } from '../modules/reports/store.js';

export function registerReportRoutes(
  app: FastifyInstance,
  deps: {
    requireAuth: preHandlerHookHandler;
    requireAdmin: preHandlerHookHandler;
    reports: ReportStore;
  },
) {
  const { requireAuth, requireAdmin, reports } = deps;

  // POST /v1/reports (Kirim laporan baru oleh pengguna)
  app.post(
    '/v1/reports',
    { preHandler: requireAuth, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = createReportInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'validation_error',
          message: 'Data laporan tidak valid. Pastikan kategori dan alasan terisi.',
        });
      }

      const report = await reports.create(req.user!.uid, parsed.data);
      return reply.code(201).send(report);
    },
  );

  // GET /v1/admin/reports (Antrean laporan untuk moderator/admin)
  app.get('/v1/admin/reports', { preHandler: [requireAuth, requireAdmin] }, async (req) => {
    const { status, limit } = req.query as { status?: ReportStatus; limit?: string };
    const numLimit = limit ? parseInt(limit, 10) : 50;
    return reports.list(status, isNaN(numLimit) ? 50 : numLimit);
  });

  // PATCH /v1/admin/reports/:id (Tindak lanjuti laporan oleh admin)
  app.patch('/v1/admin/reports/:id', { preHandler: [requireAuth, requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = moderateReportInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'validation_error',
        message: 'Format keputusan moderasi tidak valid.',
      });
    }

    try {
      const updated = await reports.moderate(id, req.user!.uid, parsed.data);
      return reply.code(200).send(updated);
    } catch {
      return reply.code(404).send({ error: 'not_found', message: 'Laporan tidak ditemukan.' });
    }
  });
}
