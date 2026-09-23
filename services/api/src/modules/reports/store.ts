import type { Firestore } from 'firebase-admin/firestore';
import {
  COLLECTIONS,
  type CreateReportInput,
  type ModerateReportInput,
  type ReportDoc,
  type ReportStatus,
} from '@placetogo/shared';
import type { NotificationStore } from '../notifications/store.js';

export interface ReportStore {
  create(reporterId: string, input: CreateReportInput): Promise<ReportDoc>;
  list(status?: ReportStatus, limit?: number): Promise<ReportDoc[]>;
  get(id: string): Promise<ReportDoc | null>;
  moderate(reportId: string, moderatorUid: string, input: ModerateReportInput): Promise<ReportDoc>;
}

export class ReportNotFoundError extends Error {
  constructor() {
    super('Laporan tidak ditemukan.');
  }
}

export class FirestoreReportStore implements ReportStore {
  constructor(
    private readonly db: Firestore,
    private readonly notifications?: NotificationStore,
  ) {}

  async create(reporterId: string, input: CreateReportInput): Promise<ReportDoc> {
    const ref = this.db.collection(COLLECTIONS.reports).doc();
    const now = Date.now();

    const doc: ReportDoc = {
      id: ref.id,
      reporterId,
      targetId: input.targetId,
      targetType: input.targetType,
      category: input.category,
      reason: input.reason,
      status: 'pending',
      createdAt: now,
    };

    await ref.set(doc);
    return doc;
  }

  async list(status?: ReportStatus, limit = 50): Promise<ReportDoc[]> {
    let query = this.db.collection(COLLECTIONS.reports).orderBy('createdAt', 'desc').limit(limit);
    if (status) {
      query = this.db
        .collection(COLLECTIONS.reports)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(limit);
    }

    const snap = await query.get();
    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        reporterId: d.reporterId,
        targetId: d.targetId,
        targetType: d.targetType,
        category: d.category,
        reason: d.reason,
        status: d.status,
        moderatorNotes: d.moderatorNotes,
        reviewedBy: d.reviewedBy,
        reviewedAt: d.reviewedAt,
        createdAt: d.createdAt,
      };
    });
  }

  async get(id: string): Promise<ReportDoc | null> {
    const snap = await this.db.collection(COLLECTIONS.reports).doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    return {
      id: snap.id,
      reporterId: d.reporterId,
      targetId: d.targetId,
      targetType: d.targetType,
      category: d.category,
      reason: d.reason,
      status: d.status,
      moderatorNotes: d.moderatorNotes,
      reviewedBy: d.reviewedBy,
      reviewedAt: d.reviewedAt,
      createdAt: d.createdAt,
    };
  }

  async moderate(
    reportId: string,
    moderatorUid: string,
    input: ModerateReportInput,
  ): Promise<ReportDoc> {
    const ref = this.db.collection(COLLECTIONS.reports).doc(reportId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new ReportNotFoundError();
    }

    const current = snap.data() as ReportDoc;
    const now = Date.now();

    const updated: ReportDoc = {
      ...current,
      status: input.status,
      moderatorNotes: input.moderatorNotes,
      reviewedBy: moderatorUid,
      reviewedAt: now,
    };

    await ref.update({
      status: input.status,
      moderatorNotes: input.moderatorNotes || null,
      reviewedBy: moderatorUid,
      reviewedAt: now,
    });

    // Jalankan tindakan moderasi jika ada
    if (input.action === 'hide_activity' && current.targetType === 'activity') {
      await this.db.collection(COLLECTIONS.activities).doc(current.targetId).update({
        status: 'cancelled',
      });
    }

    // Kirim notifikasi konfirmasi tindakan ke pelapor jika ada notificationStore
    if (this.notifications && input.status === 'action_taken') {
      await this.notifications.create({
        uid: current.reporterId,
        type: 'moderation_action',
        title: 'Laporan Telah Ditindaklanjuti',
        body: 'Terima kasih atas laporanmu. Tim keamanan placetogo telah meninjau dan mengambil tindakan yang sesuai.',
        referenceId: current.id,
        referenceType: 'report',
      });
    }

    return updated;
  }
}

export class MemoryReportStore implements ReportStore {
  private reports: ReportDoc[] = [];

  constructor(private readonly notifications?: NotificationStore) {}

  async create(reporterId: string, input: CreateReportInput): Promise<ReportDoc> {
    const doc: ReportDoc = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      reporterId,
      targetId: input.targetId,
      targetType: input.targetType,
      category: input.category,
      reason: input.reason,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.reports.push(doc);
    return doc;
  }

  async list(status?: ReportStatus, limit = 50): Promise<ReportDoc[]> {
    let list = this.reports.sort((a, b) => b.createdAt - a.createdAt);
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return list.slice(0, limit);
  }

  async get(id: string): Promise<ReportDoc | null> {
    return this.reports.find((r) => r.id === id) ?? null;
  }

  async moderate(
    reportId: string,
    moderatorUid: string,
    input: ModerateReportInput,
  ): Promise<ReportDoc> {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) throw new ReportNotFoundError();

    report.status = input.status;
    report.moderatorNotes = input.moderatorNotes;
    report.reviewedBy = moderatorUid;
    report.reviewedAt = Date.now();

    if (this.notifications && input.status === 'action_taken') {
      await this.notifications.create({
        uid: report.reporterId,
        type: 'moderation_action',
        title: 'Laporan Telah Ditindaklanjuti',
        body: 'Tim keamanan telah mengambil tindakan atas laporanmu.',
        referenceId: report.id,
        referenceType: 'report',
      });
    }

    return report;
  }
}
