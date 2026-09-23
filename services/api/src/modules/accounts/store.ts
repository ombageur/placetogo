import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS, type UserPrivate } from '@placetogo/shared';

export interface AccountStore {
  /** null bila user_private belum dibuat. */
  get(uid: string): Promise<UserPrivate | null>;
  /** Idempoten: membuat dokumen bila belum ada, tidak menimpa yang sudah ada. */
  ensure(uid: string): Promise<UserPrivate>;
}

const INITIAL: UserPrivate = { schemaVersion: 1, profileComplete: false };

function toUserPrivate(data: FirebaseFirestore.DocumentData | undefined): UserPrivate | null {
  if (!data) return null;
  return { schemaVersion: 1, profileComplete: data.profileComplete === true };
}

/** Implementasi Firestore. Admin SDK melewati Rules, jadi hanya dipanggil dari handler yang sudah terotorisasi. */
export function createFirestoreAccountStore(db: Firestore): AccountStore {
  const ref = (uid: string) => db.collection(COLLECTIONS.userPrivate).doc(uid);
  return {
    async get(uid) {
      return toUserPrivate((await ref(uid).get()).data());
    },
    async ensure(uid) {
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref(uid));
        const existing = toUserPrivate(snap.data());
        if (existing) return existing;
        tx.create(ref(uid), {
          ...INITIAL,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return INITIAL;
      });
    },
  };
}

/** Untuk tes unit tanpa Firestore. */
export function createMemoryAccountStore(): AccountStore & { docs: Map<string, UserPrivate> } {
  const docs = new Map<string, UserPrivate>();
  return {
    docs,
    async get(uid) {
      return docs.get(uid) ?? null;
    },
    async ensure(uid) {
      const existing = docs.get(uid);
      if (existing) return existing;
      docs.set(uid, { ...INITIAL });
      return INITIAL;
    },
  };
}
