import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { createTopupInputSchema, createWithdrawalInputSchema, WITHDRAWAL_METHOD_LABELS } from '@placetogo/shared';
import { InsufficientBalanceError, type WalletStore } from '../modules/wallet/store.js';

export function registerWalletRoutes(
  app: FastifyInstance,
  deps: {
    requireAuth: preHandlerHookHandler;
    requireVerified: preHandlerHookHandler;
    wallet: WalletStore;
  },
) {
  const { requireAuth, requireVerified, wallet } = deps;
  const auth = [requireAuth, requireVerified];

  // GET /v1/wallet (Saldo + 20 riwayat transaksi ledger terakhir)
  app.get('/v1/wallet', { preHandler: auth }, async (req) => {
    return wallet.getSummary(req.user!.uid);
  });

  // POST /v1/wallet/topup (Inisiasi transaksi top up)
  app.post(
    '/v1/wallet/topup',
    { preHandler: auth, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = createTopupInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'validation_error', message: 'Paket top-up atau metode bayar tidak valid.' });
      }

      try {
        const payment = await wallet.createTopup(req.user!.uid, parsed.data);
        return reply.code(201).send(payment);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal membuat pesanan top-up.';
        return reply.code(400).send({ error: 'topup_failed', message });
      }
    },
  );

  // POST /v1/wallet/withdraw (Penarikan saldo penghasilan ke rekening / e-wallet)
  app.post(
    '/v1/wallet/withdraw',
    { preHandler: auth, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = createWithdrawalInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'validation_error', message: parsed.error.issues[0]?.message || 'Data penarikan dana tidak valid.' });
      }

      try {
        const methodLabel = WITHDRAWAL_METHOD_LABELS[parsed.data.method] || parsed.data.method;
        const refId = `wd_${Date.now()}`;
        const note = `Tarik Dana ke ${methodLabel} (${parsed.data.accountNumber} a.n. ${parsed.data.accountName})`;
        
        await wallet.debitEarnings(
          req.user!.uid,
          parsed.data.amountIdr,
          'payout_withdraw',
          refId,
          note,
        );

        const updatedSummary = await wallet.getSummary(req.user!.uid);
        return reply.code(200).send(updatedSummary);
      } catch (err: unknown) {
        if (err instanceof InsufficientBalanceError) {
          return reply.code(409).send({
            error: 'insufficient_balance',
            message: 'Saldo Penghasilan kamu tidak mencukupi untuk melakukan penarikan ini.',
          });
        }
        const message = err instanceof Error ? err.message : 'Gagal memproses penarikan dana.';
        return reply.code(400).send({ error: 'withdrawal_failed', message });
      }
    },
  );
}
