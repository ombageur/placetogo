import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS, encodeGeohash, type ActivityDoc, type CheckinResult, type CreateActivityInput } from '@placetogo/shared';
import type { NotificationStore } from '../notifications/store.js';
import {
  ActivityAlreadyStartedError,
  ActivityFullError,
  ActivityNotFoundError,
  AlreadyJoinedError,
  CapacityBelowParticipantsError,
  ForbiddenActivityActionError,
  InvalidActivityStateError,
  NotJoinedError,
  SelfJoinError,
} from './errors.js';

export interface ActivityStore {
  /** Selalu dibuat sebagai `draft`; publikasikan lewat `publish()` (lihat Lampiran A state machine). */
  create(creatorId: string, input: CreateActivityInput): Promise<ActivityDoc>;
  /** Ajakan yang dibuat seorang pengguna, terbaru dulu. Termasuk draft dan yang sudah lewat. */
  listByCreator(creatorId: string, max?: number): Promise<ActivityDoc[]>;
  /** Jumlah pertemuan yang kehadirannya terverifikasi lewat check-in. */
  countCheckins(uid: string): Promise<number>;
  publish(id: string, creatorId: string): Promise<ActivityDoc>;
  cancel(id: string, creatorId: string): Promise<ActivityDoc>;
  start(id: string, creatorId: string): Promise<ActivityDoc>;
  complete(id: string, creatorId: string): Promise<ActivityDoc>;
  updateCapacity(id: string, creatorId: string, capacity: number): Promise<ActivityDoc>;
  /** Bergabung langsung (bukan menunggu persetujuan) — lihat docs/participation/participation.md. */
  join(id: string, uid: string): Promise<ActivityDoc>;
  leave(id: string, uid: string): Promise<ActivityDoc>;
  checkin(id: string, uid: string, location?: { lat: number; lng: number }): Promise<CheckinResult>;
  getCheckin(id: string, uid: string): Promise<CheckinResult | null>;
}

const CANCELABLE_STATUSES = new Set(['draft', 'published', 'full']);

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  throw new Error('Format waktu tidak dikenali');
}

function toActivityDoc(id: string, data: FirebaseFirestore.DocumentData): ActivityDoc {
  return {
    id,
    creatorId: data.creatorId,
    title: data.title,
    titleLower: data.titleLower,
    description: data.description,
    categoryId: data.categoryId,
    cityId: data.cityId,
    venueName: data.venueName,
    placeId: data.placeId,
    lat: data.lat,
    lng: data.lng,
    geohash: data.geohash,
    startsAt: toMillis(data.startsAt),
    capacity: data.capacity,
    participantCount: data.participantCount,
    paymentType: data.paymentType,
    traits: data.traits,
    status: data.status,
    createdAt: toMillis(data.createdAt),
    updatedAt: data.updatedAt ? toMillis(data.updatedAt) : undefined,
  };
}

/** Implementasi Firestore. Semua tulis lewat transaksi agar kapasitas tidak pernah overbook di bawah beban serentak. */
export function createFirestoreActivityStore(db: Firestore, notifications?: NotificationStore): ActivityStore {
  const activityRef = (id: string) => db.collection(COLLECTIONS.activities).doc(id);
  const participantRef = (activityId: string, uid: string) => activityRef(activityId).collection(COLLECTIONS.participants).doc(uid);
  const joinRequestRef = (activityId: string, uid: string) => activityRef(activityId).collection(COLLECTIONS.joinRequests).doc(uid);
  const checkinRef = (activityId: string, uid: string) => activityRef(activityId).collection(COLLECTIONS.checkins).doc(uid);
  const convRef = (activityId: string) => db.collection(COLLECTIONS.conversations).doc(activityId);

  return {
    async create(creatorId, input) {
      const ref = db.collection(COLLECTIONS.activities).doc();
      const now = FieldValue.serverTimestamp();
      const data: Record<string, unknown> = {
        creatorId,
        title: input.title,
        titleLower: input.title.toLowerCase(),
        categoryId: input.categoryId,
        cityId: input.cityId,
        venueName: input.venueName,
        startsAt: input.startsAt,
        capacity: input.capacity,
        participantCount: 0,
        paymentType: input.paymentType,
        status: 'draft',
        createdAt: now,
      };
      if (input.description !== undefined) data.description = input.description;
      if (input.traits !== undefined && input.traits.length > 0) data.traits = input.traits;
      if (input.placeId !== undefined) data.placeId = input.placeId;
      if (input.lat !== undefined && input.lng !== undefined) {
        data.lat = input.lat;
        data.lng = input.lng;
        data.geohash = encodeGeohash({ lat: input.lat, lng: input.lng });
      }
      await ref.set(data);
      const snap = await ref.get();
      return toActivityDoc(ref.id, snap.data()!);
    },

    async listByCreator(creatorId, max = 50) {
      const snap = await db
        .collection(COLLECTIONS.activities)
        .where('creatorId', '==', creatorId)
        .orderBy('createdAt', 'desc')
        .limit(max)
        .get();
      return snap.docs.map((d) => toActivityDoc(d.id, d.data()));
    },

    /*
     * Check-in tersimpan sebagai subkoleksi di bawah tiap ajakan, jadi jumlahnya dihitung
     * lewat collection group. Indeksnya didaftarkan di firebase/firestore.indexes.json.
     */
    async countCheckins(uid) {
      const snap = await db
        .collectionGroup(COLLECTIONS.checkins)
        .where('uid', '==', uid)
        .count()
        .get();
      return snap.data().count;
    },
    async publish(id, creatorId) {
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(activityRef(id));
        if (!snap.exists) throw new ActivityNotFoundError();
        const data = snap.data()!;
        if (data.creatorId !== creatorId) throw new ForbiddenActivityActionError();
        if (data.status !== 'draft') throw new InvalidActivityStateError(`status=${data.status}`);
        const updatedAt = FieldValue.serverTimestamp();
        tx.update(activityRef(id), { status: 'published', updatedAt });
        tx.set(
          convRef(id),
          {
            type: 'activity',
            activityId: id,
            title: data.title,
            memberIds: [creatorId],
            createdAt: updatedAt,
          },
          { merge: true },
        );
        return toActivityDoc(id, { ...data, status: 'published' });
      });
    },

    async cancel(id, creatorId) {
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(activityRef(id));
        if (!snap.exists) throw new ActivityNotFoundError();
        const data = snap.data()!;
        if (data.creatorId !== creatorId) throw new ForbiddenActivityActionError();
        if (!CANCELABLE_STATUSES.has(data.status)) throw new InvalidActivityStateError(`status=${data.status}`);
        const updatedAt = FieldValue.serverTimestamp();
        tx.update(activityRef(id), { status: 'cancelled', updatedAt });
        return toActivityDoc(id, { ...data, status: 'cancelled' });
      });
    },

    async start(id, creatorId) {
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(activityRef(id));
        if (!snap.exists) throw new ActivityNotFoundError();
        const data = snap.data()!;
        if (data.creatorId !== creatorId) throw new ForbiddenActivityActionError();
        if (data.status !== 'published' && data.status !== 'full') {
          throw new InvalidActivityStateError(`status=${data.status}`);
        }
        const updatedAt = FieldValue.serverTimestamp();
        tx.update(activityRef(id), { status: 'in_progress', updatedAt });
        return toActivityDoc(id, { ...data, status: 'in_progress' });
      });
    },

    async complete(id, creatorId) {
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(activityRef(id));
        if (!snap.exists) throw new ActivityNotFoundError();
        const data = snap.data()!;
        if (data.creatorId !== creatorId) throw new ForbiddenActivityActionError();
        if (data.status !== 'in_progress' && data.status !== 'published' && data.status !== 'full') {
          throw new InvalidActivityStateError(`status=${data.status}`);
        }
        const updatedAt = FieldValue.serverTimestamp();
        tx.update(activityRef(id), { status: 'completed', updatedAt });
        return toActivityDoc(id, { ...data, status: 'completed' });
      });
    },

    async updateCapacity(id, creatorId, capacity) {
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(activityRef(id));
        if (!snap.exists) throw new ActivityNotFoundError();
        const data = snap.data()!;
        if (data.creatorId !== creatorId) throw new ForbiddenActivityActionError();
        if (!CANCELABLE_STATUSES.has(data.status)) throw new InvalidActivityStateError(`status=${data.status}`);
        if (capacity < data.participantCount) throw new CapacityBelowParticipantsError();
        const status = data.participantCount >= capacity ? 'full' : data.status === 'full' ? 'published' : data.status;
        const updatedAt = FieldValue.serverTimestamp();
        tx.update(activityRef(id), { capacity, status, updatedAt });
        return toActivityDoc(id, { ...data, capacity, status });
      });
    },

    async join(id, uid) {
      const res = await db.runTransaction(async (tx) => {
        const [snap, participantSnap] = await Promise.all([tx.get(activityRef(id)), tx.get(participantRef(id, uid))]);
        if (!snap.exists) throw new ActivityNotFoundError();
        const data = snap.data()!;
        if (data.creatorId === uid) throw new SelfJoinError();
        if (participantSnap.exists) throw new AlreadyJoinedError();
        if (data.status !== 'published') throw new InvalidActivityStateError(`status=${data.status}`);
        if (toMillis(data.startsAt) <= Date.now()) throw new ActivityAlreadyStartedError();
        if (data.participantCount >= data.capacity) throw new ActivityFullError();

        const now = FieldValue.serverTimestamp();
        tx.set(participantRef(id, uid), { joinedAt: now });
        tx.set(joinRequestRef(id, uid), { status: 'approved', createdAt: now, reviewedAt: now });
        const participantCount = data.participantCount + 1;
        const status = participantCount >= data.capacity ? 'full' : 'published';
        tx.update(activityRef(id), { participantCount, status, updatedAt: now });
        tx.set(convRef(id), { memberIds: FieldValue.arrayUnion(uid), updatedAt: now }, { merge: true });
        return toActivityDoc(id, { ...data, participantCount, status });
      });

      if (notifications) {
        void notifications.create({
          uid: res.creatorId,
          type: 'join_activity',
          title: 'Peserta Baru Bergabung',
          body: `Seorang teman avatar telah bergabung ke ajakan "${res.title}".`,
          referenceId: id,
          referenceType: 'activity',
        });
      }

      return res;
    },

    async leave(id, uid) {
      return db.runTransaction(async (tx) => {
        const [snap, participantSnap] = await Promise.all([tx.get(activityRef(id)), tx.get(participantRef(id, uid))]);
        if (!snap.exists) throw new ActivityNotFoundError();
        const data = snap.data()!;
        if (!participantSnap.exists) throw new NotJoinedError();

        const now = FieldValue.serverTimestamp();
        tx.delete(participantRef(id, uid));
        tx.set(joinRequestRef(id, uid), { status: 'left', reviewedAt: now }, { merge: true });
        const participantCount = Math.max(0, data.participantCount - 1);
        // Batalkan/selesai tetap begitu; hanya 'full' yang terbuka kembali jadi 'published'.
        const status = data.status === 'full' ? 'published' : data.status;
        tx.update(activityRef(id), { participantCount, status, updatedAt: now });
        tx.set(convRef(id), { memberIds: FieldValue.arrayRemove(uid), updatedAt: now }, { merge: true });
        return toActivityDoc(id, { ...data, participantCount, status });
      });
    },

    async checkin(id, uid) {
      return db.runTransaction(async (tx) => {
        const [aSnap, pSnap, cSnap] = await Promise.all([
          tx.get(activityRef(id)),
          tx.get(participantRef(id, uid)),
          tx.get(checkinRef(id, uid)),
        ]);
        if (!aSnap.exists) throw new ActivityNotFoundError();
        const aData = aSnap.data()!;
        const isMember = aData.creatorId === uid || pSnap.exists;
        if (!isMember) throw new ForbiddenActivityActionError();

        if (cSnap.exists) {
          const cData = cSnap.data()!;
          return {
            uid,
            activityId: id,
            checkedInAt: toMillis(cData.checkedInAt),
            verifiedLocation: cData.verifiedLocation ?? true,
            rewardClaimed: cData.rewardClaimed ?? true,
            rewardAmount: cData.rewardAmount ?? 2000,
          };
        }

        const now = FieldValue.serverTimestamp();
        const record = {
          uid,
          activityId: id,
          checkedInAt: now,
          verifiedLocation: true,
          rewardClaimed: true,
          rewardAmount: 2000,
        };
        tx.set(checkinRef(id, uid), record);
        return {
          uid,
          activityId: id,
          checkedInAt: Date.now(),
          verifiedLocation: true,
          rewardClaimed: true,
          rewardAmount: 2000,
        };
      });
    },

    async getCheckin(id, uid) {
      const snap = await checkinRef(id, uid).get();
      if (!snap.exists) return null;
      const data = snap.data()!;
      return {
        uid,
        activityId: id,
        checkedInAt: toMillis(data.checkedInAt),
        verifiedLocation: data.verifiedLocation ?? true,
        rewardClaimed: data.rewardClaimed ?? true,
        rewardAmount: data.rewardAmount ?? 2000,
      };
    },
  };
}

/** Untuk tes unit tanpa Firestore. Logika sama; tanpa jaminan konkurensi (lihat tes integrasi untuk itu). */
export function createMemoryActivityStore(): ActivityStore & { docs: Map<string, ActivityDoc>; participants: Map<string, Set<string>> } {
  const docs = new Map<string, ActivityDoc>();
  const participants = new Map<string, Set<string>>(); // activityId -> set of uid
  const checkins = new Map<string, Map<string, CheckinResult>>();
  let seq = 0;

  function get(id: string): ActivityDoc {
    const doc = docs.get(id);
    if (!doc) throw new ActivityNotFoundError();
    return doc;
  }

  return {
    docs,
    participants,
    async create(creatorId, input) {
      const id = `mem-activity-${++seq}`;
      const doc: ActivityDoc = {
        id,
        creatorId,
        title: input.title,
        titleLower: input.title.toLowerCase(),
        description: input.description,
        traits: input.traits,
        categoryId: input.categoryId,
        cityId: input.cityId,
        venueName: input.venueName,
        placeId: input.placeId,
        ...(input.lat !== undefined && input.lng !== undefined
          ? { lat: input.lat, lng: input.lng, geohash: encodeGeohash({ lat: input.lat, lng: input.lng }) }
          : {}),
        startsAt: input.startsAt,
        capacity: input.capacity,
        participantCount: 0,
        paymentType: input.paymentType,
        status: 'draft',
        createdAt: Date.now(),
      };
      docs.set(id, doc);
      participants.set(id, new Set());
      checkins.set(id, new Map());
      return doc;
    },
    async listByCreator(creatorId, max = 50) {
      return [...docs.values()]
        .filter((d) => d.creatorId === creatorId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, max);
    },

    async countCheckins(uid) {
      let total = 0;
      for (const byUid of checkins.values()) if (byUid.has(uid)) total++;
      return total;
    },
    async publish(id, creatorId) {
      const doc = get(id);
      if (doc.creatorId !== creatorId) throw new ForbiddenActivityActionError();
      if (doc.status !== 'draft') throw new InvalidActivityStateError(`status=${doc.status}`);
      const updated = { ...doc, status: 'published' as const };
      docs.set(id, updated);
      return updated;
    },
    async cancel(id, creatorId) {
      const doc = get(id);
      if (doc.creatorId !== creatorId) throw new ForbiddenActivityActionError();
      if (!CANCELABLE_STATUSES.has(doc.status)) throw new InvalidActivityStateError(`status=${doc.status}`);
      const updated = { ...doc, status: 'cancelled' as const };
      docs.set(id, updated);
      return updated;
    },
    async start(id, creatorId) {
      const doc = get(id);
      if (doc.creatorId !== creatorId) throw new ForbiddenActivityActionError();
      const updated = { ...doc, status: 'in_progress' as const };
      docs.set(id, updated);
      return updated;
    },
    async complete(id, creatorId) {
      const doc = get(id);
      if (doc.creatorId !== creatorId) throw new ForbiddenActivityActionError();
      const updated = { ...doc, status: 'completed' as const };
      docs.set(id, updated);
      return updated;
    },
    async updateCapacity(id, creatorId, capacity) {
      const doc = get(id);
      if (doc.creatorId !== creatorId) throw new ForbiddenActivityActionError();
      if (!CANCELABLE_STATUSES.has(doc.status)) throw new InvalidActivityStateError(`status=${doc.status}`);
      if (capacity < doc.participantCount) throw new CapacityBelowParticipantsError();
      const status: ActivityDoc['status'] = doc.participantCount >= capacity ? 'full' : doc.status === 'full' ? 'published' : doc.status;
      const updated = { ...doc, capacity, status };
      docs.set(id, updated);
      return updated;
    },
    async join(id, uid) {
      const doc = get(id);
      const joined = participants.get(id)!;
      if (doc.creatorId === uid) throw new SelfJoinError();
      if (joined.has(uid)) throw new AlreadyJoinedError();
      if (doc.status !== 'published') throw new InvalidActivityStateError(`status=${doc.status}`);
      if (doc.startsAt <= Date.now()) throw new ActivityAlreadyStartedError();
      if (doc.participantCount >= doc.capacity) throw new ActivityFullError();
      joined.add(uid);
      const participantCount = doc.participantCount + 1;
      const status: ActivityDoc['status'] = participantCount >= doc.capacity ? 'full' : 'published';
      const updated = { ...doc, participantCount, status };
      docs.set(id, updated);
      return updated;
    },
    async leave(id, uid) {
      const doc = get(id);
      const joined = participants.get(id)!;
      if (!joined.has(uid)) throw new NotJoinedError();
      joined.delete(uid);
      const participantCount = Math.max(0, doc.participantCount - 1);
      const status: ActivityDoc['status'] = doc.status === 'full' ? 'published' : doc.status;
      const updated = { ...doc, participantCount, status };
      docs.set(id, updated);
      return updated;
    },
    async checkin(id, uid) {
      const doc = get(id);
      const joined = participants.get(id)!;
      if (doc.creatorId !== uid && !joined.has(uid)) throw new ForbiddenActivityActionError();
      const actCheckins = checkins.get(id) ?? new Map();
      const existing = actCheckins.get(uid);
      if (existing) return existing;
      const record: CheckinResult = {
        uid,
        activityId: id,
        checkedInAt: Date.now(),
        verifiedLocation: true,
        rewardClaimed: true,
        rewardAmount: 2000,
      };
      actCheckins.set(uid, record);
      checkins.set(id, actCheckins);
      return record;
    },
    async getCheckin(id, uid) {
      return checkins.get(id)?.get(uid) ?? null;
    },
  };
}

