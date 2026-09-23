import type { FastifyInstance } from 'fastify';
import type { HealthStatus } from '@placetogo/shared';

export type ReadinessCheck = () => Promise<void>;

const SERVICE = 'placetogo-api';
const CHECK_TIMEOUT_MS = 3000;

/** /healthz: liveness murni, tanpa dependensi. /readyz: memeriksa dependensi kritis. */
export function registerHealthRoutes(app: FastifyInstance, checks: Record<string, ReadinessCheck>) {
  app.get('/healthz', async (): Promise<HealthStatus> => ({
    status: 'ok',
    service: SERVICE,
    time: new Date().toISOString(),
  }));

  app.get('/readyz', async (_req, reply) => {
    const results: Record<string, 'ok' | 'fail'> = {};
    await Promise.all(
      Object.entries(checks).map(async ([name, check]) => {
        let timer: NodeJS.Timeout | undefined;
        try {
          await Promise.race([
            check(),
            new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error('timeout')), CHECK_TIMEOUT_MS);
            }),
          ]);
          results[name] = 'ok';
        } catch {
          results[name] = 'fail';
        } finally {
          clearTimeout(timer);
        }
      }),
    );
    const healthy = Object.values(results).every((r) => r === 'ok');
    return reply.code(healthy ? 200 : 503).send({
      status: healthy ? 'ok' : 'degraded',
      service: SERVICE,
      checks: results,
      time: new Date().toISOString(),
    });
  });
}
