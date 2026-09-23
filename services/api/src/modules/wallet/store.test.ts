import type { Firestore } from 'firebase-admin/firestore';
import { PAYMENT_METHODS, TOPUP_PACKAGES } from '@placetogo/shared';
import { describe, expect, it } from 'vitest';
import type { PaymentGateway } from '../doku/contract.js';
import { FirestoreWalletStore } from './store.js';

/**
 * Firestore palsu yang hanya merekam apa yang ditulis. Tujuannya satu: memastikan dokumen
 * yang dikirim ke Firestore tidak pernah memuat nilai undefined, karena Firestore menolaknya
 * saat dijalankan sementara TypeScript menganggapnya sah untuk field opsional.
 */
function fakeDb() {
  const writes: { path: string; data: Record<string, unknown> }[] = [];
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        set: async (data: Record<string, unknown>) => {
          writes.push({ path: `${name}/${id}`, data });
        },
      }),
    }),
  } as unknown as Firestore;
  return { db, writes };
}

const fakeDoku: PaymentGateway = {
  createCheckout: async () => ({ redirectUrl: 'https://sandbox.example/checkout/abc' }),
} as PaymentGateway;

function undefinedKeys(data: Record<string, unknown>): string[] {
  return Object.entries(data)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key);
}

describe('FirestoreWalletStore.createTopup', () => {
  const packageId = TOPUP_PACKAGES[0]!.id;

  for (const paymentMethod of PAYMENT_METHODS) {
    it(`menulis dokumen tanpa nilai undefined untuk metode ${paymentMethod}`, async () => {
      const { db, writes } = fakeDb();
      const store = new FirestoreWalletStore(db, fakeDoku);

      await store.createTopup('uid-1', { packageId, paymentMethod });

      expect(writes).toHaveLength(1);
      // Regresi: vaNumber dan qrString saling eksklusif, jadi salah satunya selalu undefined
      // dan dulu membuat top-up gagal dengan "Cannot use undefined as a Firestore value".
      expect(undefinedKeys(writes[0]!.data)).toEqual([]);
    });
  }

  it('menyertakan nomor virtual account hanya untuk metode VA', async () => {
    const { db, writes } = fakeDb();
    const store = new FirestoreWalletStore(db, fakeDoku);

    await store.createTopup('uid-1', { packageId, paymentMethod: 'bca_va' });
    expect(writes[0]!.data.vaNumber).toMatch(/^80777\d{8}$/);
    expect('qrString' in writes[0]!.data).toBe(false);
  });

  it('menyertakan string QR hanya untuk QRIS', async () => {
    const { db, writes } = fakeDb();
    const store = new FirestoreWalletStore(db, fakeDoku);

    await store.createTopup('uid-1', { packageId, paymentMethod: 'qris' });
    expect(typeof writes[0]!.data.qrString).toBe('string');
    expect('vaNumber' in writes[0]!.data).toBe(false);
  });
});
