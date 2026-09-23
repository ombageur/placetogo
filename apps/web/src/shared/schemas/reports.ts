import { z } from 'zod';
import { emptyToUndefined } from '../lib/optional-text';

export const REPORT_TARGET_TYPES = ['activity', 'user', 'message'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];
export const reportTargetTypeSchema = z.enum(REPORT_TARGET_TYPES);

export const REPORT_CATEGORIES = [
  'spam',
  'harassment',
  'inappropriate_content',
  'no_show',
  'safety_hazard',
  'other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export const reportCategorySchema = z.enum(REPORT_CATEGORIES);

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  spam: 'Spam atau Promosi Ilegal',
  harassment: 'Pelecehan atau Perilaku Mengganggu',
  inappropriate_content: 'Konten Tidak Pantas / SARA',
  no_show: 'Tidak Hadir Tanpa Kabar (No-Show)',
  safety_hazard: 'Potensi Bahaya / Isu Keamanan',
  other: 'Alasan Lainnya',
};

export const REPORT_STATUSES = ['pending', 'reviewed', 'dismissed', 'action_taken'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const reportStatusSchema = z.enum(REPORT_STATUSES);

export const MODERATION_ACTIONS = ['none', 'warn', 'hide_activity', 'suspend_user'] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];
export const moderationActionSchema = z.enum(MODERATION_ACTIONS);

/** Skema input pengiriman laporan dari pengguna */
export const createReportInputSchema = z.object({
  targetId: z.string().min(1),
  targetType: reportTargetTypeSchema,
  category: reportCategorySchema,
  reason: z.string().trim().min(5, 'Mohon jelaskan alasan laporan minimal 5 karakter.').max(1000),
});
export type CreateReportInput = z.infer<typeof createReportInputSchema>;

/** Skema dokumen di koleksi reports/{id} */
export const reportDocSchema = z.object({
  id: z.string().min(1),
  reporterId: z.string().min(1),
  targetId: z.string().min(1),
  targetType: reportTargetTypeSchema,
  category: reportCategorySchema,
  reason: z.string().min(1),
  status: reportStatusSchema,
  moderatorNotes: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.number().int().positive().optional(),
  createdAt: z.number().int().positive(),
});
export type ReportDoc = z.infer<typeof reportDocSchema>;

/** Skema input tindakan moderasi oleh admin */
export const moderateReportInputSchema = z.object({
  status: reportStatusSchema,
  moderatorNotes: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  action: moderationActionSchema.default('none'),
});
export type ModerateReportInput = z.infer<typeof moderateReportInputSchema>;
