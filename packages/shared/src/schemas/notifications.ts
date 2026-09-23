import { z } from 'zod';

export const NOTIFICATION_TYPES = [
  'join_activity',
  'leave_activity',
  'activity_started',
  'activity_completed',
  'activity_cancelled',
  'new_message',
  'reward_claimed',
  'appreciation_received',
  'moderation_action',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export const NOTIFICATION_REFERENCE_TYPES = [
  'activity',
  'conversation',
  'wallet',
  'report',
] as const;

export type NotificationReferenceType = (typeof NOTIFICATION_REFERENCE_TYPES)[number];
export const notificationReferenceTypeSchema = z.enum(NOTIFICATION_REFERENCE_TYPES);

/** Skema dokumen di koleksi notifications/{id} */
export const notificationDocSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  referenceId: z.string().optional(),
  referenceType: notificationReferenceTypeSchema.optional(),
  readAt: z.number().int().positive().optional(),
  createdAt: z.number().int().positive(),
});

export type NotificationDoc = z.infer<typeof notificationDocSchema>;

/** Skema respons daftar notifikasi */
export const notificationListResponseSchema = z.object({
  items: z.array(notificationDocSchema),
  unreadCount: z.number().int().min(0),
});

export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
