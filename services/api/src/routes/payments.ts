import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import type { PaymentGateway } from '../modules/doku/contract.js';
import type { WalletStore } from '../modules/wallet/store.js';

export function registerPaymentRoutes(
  app: FastifyInstance,
  deps: {
    requireAuth: preHandlerHookHandler;
    wallet: WalletStore;
    doku: PaymentGateway;
  },
) {
  const { requireAuth, wallet, doku } = deps;

  // GET /v1/payments/:orderId (Polling status transaksi pembayaran)
  app.get('/v1/payments/:orderId', { preHandler: requireAuth }, async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const payment = await wallet.getPayment(orderId, req.user!.uid);
    if (!payment) {
      return reply.code(404).send({ error: 'payment_not_found', message: 'Pesanan tidak ditemukan.' });
    }
    return payment;
  });

  // POST /v1/payments/doku/notify (Webhook penerima notifikasi DOKU)
  app.post(
    '/v1/payments/doku/notify',
    { config: { rawBody: true } },
    async (req, reply) => {
      const headers = req.headers as Record<string, string | undefined>;
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      // Verifikasi signature DOKU HMAC
      const isValid = doku.verifyNotification(rawBody, headers);
      if (!isValid) {
        return reply.code(400).send({ error: 'invalid_signature', message: 'Signature tidak valid.' });
      }

      const body = (typeof req.body === 'object' ? req.body : JSON.parse(rawBody)) as {
        order?: { invoice_number?: string };
        transaction?: { status?: string };
      };

      const orderId = body?.order?.invoice_number;
      if (!orderId) {
        return reply.code(400).send({ error: 'invalid_payload', message: 'Invoice number tidak ditemukan.' });
      }

      try {
        const result = await wallet.processPaymentSuccess(orderId, body);
        return reply.code(200).send({ status: 'OK', orderId: result.orderId });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memproses pembayaran.';
        return reply.code(400).send({ error: 'process_failed', message });
      }
    },
  );

  // POST /v1/payments/:orderId/simulate-success (Simulasi instan untuk pengujian Sandbox / Demo)
  app.post('/v1/payments/:orderId/simulate-success', { preHandler: requireAuth }, async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const payment = await wallet.getPayment(orderId, req.user!.uid);
    if (!payment) {
      return reply.code(404).send({ error: 'payment_not_found', message: 'Pesanan tidak ditemukan.' });
    }

    try {
      const result = await wallet.processPaymentSuccess(orderId, { simulated: true, uid: req.user!.uid });
      return reply.code(200).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal simulasi pembayaran.';
      return reply.code(400).send({ error: 'simulation_failed', message });
    }
  });
}
