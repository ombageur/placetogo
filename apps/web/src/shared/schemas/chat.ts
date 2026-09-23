import { z } from 'zod';

export const CONVERSATION_TYPES = ['activity', 'direct'] as const;
export const conversationTypeSchema = z.enum(CONVERSATION_TYPES);

/** Skema pesan di conversations/{conversationId}/messages/{messageId} */
export const messageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  senderId: z.string().min(1),
  senderName: z.string().min(1),
  senderAvatarId: z.string().min(1),
  body: z.string().trim().min(1).max(1000),
  createdAt: z.number().int().positive(),
});
export type Message = z.infer<typeof messageSchema>;

export const sendMessageInputSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

/** Skema dokumen percakapan di conversations/{id} */
export const conversationSchema = z.object({
  id: z.string().min(1),
  type: conversationTypeSchema,
  activityId: z.string().optional(),
  title: z.string().min(1).max(100),
  memberIds: z.array(z.string().min(1)),
  lastMessageAt: z.number().int().positive().optional(),
  lastMessageText: z.string().optional(),
  lastSenderId: z.string().optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive().optional(),
});
export type ConversationDoc = z.infer<typeof conversationSchema>;
