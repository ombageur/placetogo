import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS, type AppreciationDoc, type SendAppreciationInput } from '@placetogo/shared';
import type { WalletStore } from '../wallet/store.js';
import { withoutUndefined } from '../../lib/firestore-data.js';

export interface AppreciationStore {
  send(fromUid: string, input: SendAppreciationInput): Promise<AppreciationDoc>;
  listByActivity(activityId: string, fromUid: string): Promise<AppreciationDoc[]>;
  /** Hadiah yang diterima pengguna, terbaru dulu. */
  listReceived(toUid: string, max?: number): Promise<AppreciationDoc[]>;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  throw new Error('Format waktu tidak dikenali');
}

function toAppreciationDoc(id: string, data: FirebaseFirestore.DocumentData): AppreciationDoc {
  return {
    id,
    fromUid: data.fromUid,
    toUid: data.toUid,
    activityId: data.activityId,
    amount: data.amount,
    note: data.note,
    createdAt: toMillis(data.createdAt),
  };
}

import type { NotificationStore } from '../notifications/store.js';

export function createFirestoreAppreciationStore(
  db: Firestore,
  walletStore?: WalletStore,
  notifications?: NotificationStore,
): AppreciationStore {
  const col = db.collection(COLLECTIONS.appreciations);

  return {
    async send(fromUid, input) {
      const ref = col.doc();
      const now = FieldValue.serverTimestamp();

      // Jika ada walletStore, debit Coin pengirim dan kredit Penghasilan (Rupiah) penerima
      if (walletStore) {
        await walletStore.debit(
          fromUid,
          input.amount,
          'appreciation_send',
          ref.id,
          input.note ? `Beli Hadiah [Coin]: "${input.note}"` : 'Beli Hadiah Apresiasi (Coin)',
        );
        await walletStore.creditEarnings(
          input.toUid,
          input.amount,
          'appreciation_receive',
          ref.id,
          input.note ? `Hadiah Masuk [Penghasilan Rp]: "${input.note}"` : 'Menerima Hadiah Apresiasi (Penghasilan)',
        );
      }

      const data = withoutUndefined({
        fromUid,
        toUid: input.toUid,
        // Dukungan lepas tidak tertaut aktivitas apa pun.
        activityId: input.activityId,
        amount: input.amount,
        note: input.note,
        createdAt: now,
      });
      await ref.set(data);
      const snap = await ref.get();
      const res = toAppreciationDoc(ref.id, snap.data()!);

      if (notifications) {
        void notifications.create({
          uid: input.toUid,
          type: 'appreciation_received',
          title: 'Hadiah Apresiasi Masuk! 🎁',
          body: `Kamu menerima hadiah senilai Rp${input.amount.toLocaleString('id-ID')} sebagai saldo Penghasilan yang dapat ditarik ke rekening / e-wallet${input.note ? `: "${input.note}"` : '.'}`,
          ...(input.activityId
            ? { referenceId: input.activityId, referenceType: 'activity' as const }
            : {}),
        });
      }

      return res;
    },

    async listByActivity(activityId, fromUid) {
      const snap = await col
        .where('activityId', '==', activityId)
        .where('fromUid', '==', fromUid)
        .get();
      return snap.docs.map((d) => toAppreciationDoc(d.id, d.data()));
    },

    async listReceived(toUid, max = 50) {
      const snap = await col
        .where('toUid', '==', toUid)
        .orderBy('createdAt', 'desc')
        .limit(max)
        .get();
      return snap.docs.map((d) => toAppreciationDoc(d.id, d.data()));
    },
  };
}

export function createMemoryAppreciationStore(walletStore?: WalletStore): AppreciationStore {
  const items: AppreciationDoc[] = [];

  return {
    async send(fromUid, input) {
      const id = `apprec-${Math.random().toString(36).slice(2, 9)}`;

      if (walletStore) {
        await walletStore.debit(fromUid, input.amount, 'appreciation_send', id, 'Kirim Apresiasi Koin');
        await walletStore.credit(input.toUid, input.amount, 'appreciation_receive', id, 'Terima Apresiasi Koin');
      }

      const doc: AppreciationDoc = {
        id,
        fromUid,
        toUid: input.toUid,
        activityId: input.activityId,
        amount: input.amount,
        note: input.note,
        createdAt: Date.now(),
      };
      items.push(doc);
      return doc;
    },

    async listByActivity(activityId, fromUid) {
      return items.filter((d) => d.activityId === activityId && d.fromUid === fromUid);
    },

    async listReceived(toUid, max = 50) {
      return items
        .filter((d) => d.toUid === toUid)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, max);
    },
  };
}
