import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS, type MyProfile, type ProfileInput } from '@placetogo/shared';

export interface ProfileStore {
  /** null bila profil belum pernah disimpan. */
  get(uid: string): Promise<MyProfile | null>;
  /** Upsert atomik: users/{uid} (publik) + user_private/{uid} (profileComplete, preferensi privasi). */
  save(uid: string, input: ProfileInput): Promise<MyProfile>;
}

function toMyProfile(pub: FirebaseFirestore.DocumentData | undefined, priv: FirebaseFirestore.DocumentData | undefined): MyProfile | null {
  if (!pub || !priv?.profileComplete) return null;
  return {
    displayName: pub.displayName,
    avatarId: pub.avatarId,
    bio: pub.bio,
    cityId: priv.cityId, // canonical; users/{uid}.cityId bisa hilang bila cityVisible=false
    cityVisible: priv.cityVisible === true,
    interests: pub.interests,
  };
}

/** Implementasi Firestore. Dipanggil hanya dari handler yang sudah terotorisasi (uid dari token). */
export function createFirestoreProfileStore(db: Firestore): ProfileStore {
  const userRef = (uid: string) => db.collection(COLLECTIONS.users).doc(uid);
  const privateRef = (uid: string) => db.collection(COLLECTIONS.userPrivate).doc(uid);

  return {
    async get(uid) {
      const [pub, priv] = await Promise.all([userRef(uid).get(), privateRef(uid).get()]);
      return toMyProfile(pub.data(), priv.data());
    },

    async save(uid, input) {
      return db.runTransaction(async (tx) => {
        const [pubSnap, privSnap] = await Promise.all([tx.get(userRef(uid)), tx.get(privateRef(uid))]);
        const now = FieldValue.serverTimestamp();

        const publicData: Record<string, unknown> = {
          displayName: input.displayName,
          avatarId: input.avatarId,
          interests: input.interests,
          bio: input.bio ?? FieldValue.delete(),
          cityId: input.cityVisible ? input.cityId : FieldValue.delete(),
          updatedAt: now,
        };
        if (!pubSnap.exists) publicData.createdAt = now;
        tx.set(userRef(uid), publicData, { merge: true });

        const privateData: Record<string, unknown> = {
          schemaVersion: 1,
          profileComplete: true,
          cityId: input.cityId,
          cityVisible: input.cityVisible,
          updatedAt: now,
        };
        if (!privSnap.exists) privateData.createdAt = now;
        tx.set(privateRef(uid), privateData, { merge: true });

        return {
          displayName: input.displayName,
          avatarId: input.avatarId,
          bio: input.bio,
          cityId: input.cityId,
          cityVisible: input.cityVisible,
          interests: input.interests,
        };
      });
    },
  };
}

/** Untuk tes unit tanpa Firestore. */
export function createMemoryProfileStore(): ProfileStore & { docs: Map<string, MyProfile> } {
  const docs = new Map<string, MyProfile>();
  return {
    docs,
    async get(uid) {
      return docs.get(uid) ?? null;
    },
    async save(uid, input) {
      const profile: MyProfile = {
        displayName: input.displayName,
        avatarId: input.avatarId,
        bio: input.bio,
        cityId: input.cityId,
        cityVisible: input.cityVisible,
        interests: input.interests,
      };
      docs.set(uid, profile);
      return profile;
    },
  };
}
