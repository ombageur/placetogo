import type { Firestore } from 'firebase-admin/firestore';
import {
  COLLECTIONS,
  type NotificationDoc,
  type NotificationListResponse,
  type NotificationReferenceType,
  type NotificationType,
} from '@placetogo/shared';

export interface CreateNotificationInput {
  uid: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
}

export interface NotificationStore {
  list(uid: string, limit?: number): Promise<NotificationListResponse>;
  create(input: CreateNotificationInput): Promise<NotificationDoc>;
  createBatch(inputs: CreateNotificationInput[]): Promise<void>;
  markAsRead(uid: string, id: string): Promise<boolean>;
  markAllAsRead(uid: string): Promise<number>;
  getUnreadCount(uid: string): Promise<number>;
}

export class FirestoreNotificationStore implements NotificationStore {
  constructor(private readonly db: Firestore) {}

  async list(uid: string, limit = 30): Promise<NotificationListResponse> {
    const col = this.db.collection(COLLECTIONS.notifications);
    const snap = await col
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const items: NotificationDoc[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        uid: d.uid,
        type: d.type,
        title: d.title,
        body: d.body,
        referenceId: d.referenceId,
        referenceType: d.referenceType,
        readAt: d.readAt,
        createdAt: d.createdAt,
      };
    });

    const unreadCount = items.filter((item) => !item.readAt).length;

    return { items, unreadCount };
  }

  async create(input: CreateNotificationInput): Promise<NotificationDoc> {
    const ref = this.db.collection(COLLECTIONS.notifications).doc();
    const now = Date.now();

    const doc: NotificationDoc = {
      id: ref.id,
      uid: input.uid,
      type: input.type,
      title: input.title,
      body: input.body,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      createdAt: now,
    };

    await ref.set(doc);
    return doc;
  }

  async createBatch(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;
    const batch = this.db.batch();
    const now = Date.now();

    for (const input of inputs) {
      const ref = this.db.collection(COLLECTIONS.notifications).doc();
      batch.set(ref, {
        id: ref.id,
        uid: input.uid,
        type: input.type,
        title: input.title,
        body: input.body,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        createdAt: now,
      });
    }

    await batch.commit();
  }

  async markAsRead(uid: string, id: string): Promise<boolean> {
    const ref = this.db.collection(COLLECTIONS.notifications).doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.uid !== uid) {
      return false;
    }

    if (!snap.data()?.readAt) {
      await ref.update({ readAt: Date.now() });
    }
    return true;
  }

  async markAllAsRead(uid: string): Promise<number> {
    const col = this.db.collection(COLLECTIONS.notifications);
    const snap = await col.where('uid', '==', uid).get();
    const now = Date.now();
    let updated = 0;

    const batch = this.db.batch();
    for (const doc of snap.docs) {
      if (!doc.data()?.readAt) {
        batch.update(doc.ref, { readAt: now });
        updated++;
      }
    }

    if (updated > 0) {
      await batch.commit();
    }
    return updated;
  }

  async getUnreadCount(uid: string): Promise<number> {
    const snap = await this.db
      .collection(COLLECTIONS.notifications)
      .where('uid', '==', uid)
      .where('readAt', '==', null)
      .count()
      .get();
    return snap.data().count;
  }
}

export class MemoryNotificationStore implements NotificationStore {
  private items: NotificationDoc[] = [];

  async list(uid: string, limit = 30): Promise<NotificationListResponse> {
    const userItems = this.items
      .filter((i) => i.uid === uid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
    const unreadCount = userItems.filter((i) => !i.readAt).length;
    return { items: userItems, unreadCount };
  }

  async create(input: CreateNotificationInput): Promise<NotificationDoc> {
    const doc: NotificationDoc = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      uid: input.uid,
      type: input.type,
      title: input.title,
      body: input.body,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      createdAt: Date.now(),
    };
    this.items.push(doc);
    return doc;
  }

  async createBatch(inputs: CreateNotificationInput[]): Promise<void> {
    for (const input of inputs) {
      await this.create(input);
    }
  }

  async markAsRead(uid: string, id: string): Promise<boolean> {
    const item = this.items.find((i) => i.id === id && i.uid === uid);
    if (!item) return false;
    item.readAt = Date.now();
    return true;
  }

  async markAllAsRead(uid: string): Promise<number> {
    let count = 0;
    const now = Date.now();
    for (const item of this.items) {
      if (item.uid === uid && !item.readAt) {
        item.readAt = now;
        count++;
      }
    }
    return count;
  }

  async getUnreadCount(uid: string): Promise<number> {
    return this.items.filter((i) => i.uid === uid && !i.readAt).length;
  }
}
