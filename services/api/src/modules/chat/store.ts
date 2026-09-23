import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS, type ConversationDoc, type Message } from '@placetogo/shared';
import { ConversationNotFoundError, ForbiddenConversationActionError } from './errors.js';

export interface ChatStore {
  getOrCreateActivityConversation(activityId: string, creatorUid: string, title: string): Promise<ConversationDoc>;
  syncActivityMembers(activityId: string, memberUids: string[], title?: string): Promise<void>;
  listUserConversations(uid: string): Promise<ConversationDoc[]>;
  getConversation(conversationId: string, uid: string): Promise<ConversationDoc>;
  sendMessage(
    conversationId: string,
    senderUid: string,
    senderName: string,
    senderAvatarId: string,
    body: string,
  ): Promise<Message>;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  throw new Error('Format waktu tidak dikenali');
}

function toConversationDoc(id: string, data: FirebaseFirestore.DocumentData): ConversationDoc {
  return {
    id,
    type: data.type,
    activityId: data.activityId,
    title: data.title,
    memberIds: data.memberIds ?? [],
    lastMessageAt: data.lastMessageAt ? toMillis(data.lastMessageAt) : undefined,
    lastMessageText: data.lastMessageText,
    lastSenderId: data.lastSenderId,
    createdAt: toMillis(data.createdAt),
    updatedAt: data.updatedAt ? toMillis(data.updatedAt) : undefined,
  };
}

export function createFirestoreChatStore(db: Firestore): ChatStore {
  const convRef = (id: string) => db.collection(COLLECTIONS.conversations).doc(id);

  return {
    async getOrCreateActivityConversation(activityId, creatorUid, title) {
      const ref = convRef(activityId);
      const snap = await ref.get();
      if (snap.exists) {
        return toConversationDoc(ref.id, snap.data()!);
      }
      const now = FieldValue.serverTimestamp();
      const newDoc = {
        type: 'activity',
        activityId,
        title,
        memberIds: [creatorUid],
        createdAt: now,
      };
      await ref.set(newDoc);
      const createdSnap = await ref.get();
      return toConversationDoc(ref.id, createdSnap.data()!);
    },

    async syncActivityMembers(activityId, memberUids, title) {
      const ref = convRef(activityId);
      const snap = await ref.get();
      const now = FieldValue.serverTimestamp();
      if (!snap.exists) {
        await ref.set({
          type: 'activity',
          activityId,
          title: title ?? 'Diskusi Ajakan',
          memberIds: memberUids,
          createdAt: now,
        });
      } else {
        const updatePayload: Record<string, unknown> = {
          memberIds: memberUids,
          updatedAt: now,
        };
        if (title) updatePayload.title = title;
        await ref.update(updatePayload);
      }
    },

    async listUserConversations(uid) {
      const snap = await db
        .collection(COLLECTIONS.conversations)
        .where('memberIds', 'array-contains', uid)
        .get();

      const list = snap.docs.map((d) => toConversationDoc(d.id, d.data()));
      // Urutkan percakapan dengan pesan terbaru di atas
      return list.sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt));
    },

    async getConversation(conversationId, uid) {
      const snap = await convRef(conversationId).get();
      if (!snap.exists) throw new ConversationNotFoundError();
      const data = snap.data()!;
      const memberIds: string[] = data.memberIds ?? [];
      if (!memberIds.includes(uid)) throw new ForbiddenConversationActionError();
      return toConversationDoc(snap.id, data);
    },

    async sendMessage(conversationId, senderUid, senderName, senderAvatarId, body) {
      return db.runTransaction(async (tx) => {
        const cRef = convRef(conversationId);
        const cSnap = await tx.get(cRef);
        if (!cSnap.exists) throw new ConversationNotFoundError();
        const cData = cSnap.data()!;
        const memberIds: string[] = cData.memberIds ?? [];
        if (!memberIds.includes(senderUid)) throw new ForbiddenConversationActionError();

        const mRef = cRef.collection(COLLECTIONS.messages).doc();
        const now = FieldValue.serverTimestamp();

        tx.set(mRef, {
          conversationId,
          senderId: senderUid,
          senderName,
          senderAvatarId,
          body,
          createdAt: now,
        });

        tx.update(cRef, {
          lastMessageAt: now,
          lastMessageText: body.slice(0, 80),
          lastSenderId: senderUid,
          updatedAt: now,
        });

        return {
          id: mRef.id,
          conversationId,
          senderId: senderUid,
          senderName,
          senderAvatarId,
          body,
          createdAt: Date.now(),
        };
      });
    },
  };
}

export function createMemoryChatStore(): ChatStore {
  const convs = new Map<string, ConversationDoc>();
  const messages = new Map<string, Message[]>();

  return {
    async getOrCreateActivityConversation(activityId, creatorUid, title) {
      let conv = convs.get(activityId);
      if (!conv) {
        conv = {
          id: activityId,
          type: 'activity',
          activityId,
          title,
          memberIds: [creatorUid],
          createdAt: Date.now(),
        };
        convs.set(activityId, conv);
        messages.set(activityId, []);
      }
      return conv;
    },

    async syncActivityMembers(activityId, memberUids, title) {
      const conv = convs.get(activityId);
      if (conv) {
        conv.memberIds = memberUids;
        if (title) conv.title = title;
        conv.updatedAt = Date.now();
      } else {
        convs.set(activityId, {
          id: activityId,
          type: 'activity',
          activityId,
          title: title ?? 'Diskusi Ajakan',
          memberIds: memberUids,
          createdAt: Date.now(),
        });
        messages.set(activityId, []);
      }
    },

    async listUserConversations(uid) {
      const list: ConversationDoc[] = [];
      for (const conv of convs.values()) {
        if (conv.memberIds.includes(uid)) list.push(conv);
      }
      return list.sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt));
    },

    async getConversation(conversationId, uid) {
      const conv = convs.get(conversationId);
      if (!conv) throw new ConversationNotFoundError();
      if (!conv.memberIds.includes(uid)) throw new ForbiddenConversationActionError();
      return conv;
    },

    async sendMessage(conversationId, senderUid, senderName, senderAvatarId, body) {
      const conv = convs.get(conversationId);
      if (!conv) throw new ConversationNotFoundError();
      if (!conv.memberIds.includes(senderUid)) throw new ForbiddenConversationActionError();

      const now = Date.now();
      const msg: Message = {
        id: `msg-${Math.random().toString(36).slice(2, 9)}`,
        conversationId,
        senderId: senderUid,
        senderName,
        senderAvatarId,
        body,
        createdAt: now,
      };

      const list = messages.get(conversationId) ?? [];
      list.push(msg);
      messages.set(conversationId, list);

      conv.lastMessageAt = now;
      conv.lastMessageText = body.slice(0, 80);
      conv.lastSenderId = senderUid;
      conv.updatedAt = now;

      return msg;
    },
  };
}
