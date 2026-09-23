'use client';

import * as React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  REPORT_CATEGORY_LABELS,
  type ModerateReportInput,
  type ReportDoc,
  type ReportStatus,
} from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ErrorState } from '@/components/ui/states';
import { SkeletonList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { listAdminReports, moderateReport, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

export function ModerationView() {
  const { toast } = useToast();
  const [reports, setReports] = React.useState<ReportDoc[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [filter, setFilter] = React.useState<ReportStatus | 'all'>('pending');

  const [selectedReport, setSelectedReport] = React.useState<ReportDoc | null>(null);
  const [actionModalOpen, setActionModalOpen] = React.useState(false);
  const [moderatorNotes, setModeratorNotes] = React.useState('');
  const [actionType, setActionType] = React.useState<ModerateReportInput['action']>('none');
  const [actionStatus, setActionStatus] = React.useState<ReportStatus>('action_taken');
  const [submitting, setSubmitting] = React.useState(false);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await listAdminReports(filter === 'all' ? undefined : filter);
      setReports(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useDeferredEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  function handleOpenAction(report: ReportDoc, status: ReportStatus, action: ModerateReportInput['action'] = 'none') {
    setSelectedReport(report);
    setActionStatus(status);
    setActionType(action);
    setModeratorNotes('');
    setActionModalOpen(true);
  }

  async function handleModerateSubmit() {
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      await moderateReport(selectedReport.id, {
        status: actionStatus,
        moderatorNotes: moderatorNotes.trim() || undefined,
        action: actionType,
      });

      toast({
        title: 'Laporan Ditindaklanjuti',
        description: 'Status laporan dan tindakan moderasi berhasil disimpan.',
        variant: 'success',
      });

      setActionModalOpen(false);
      void fetchReports();
    } catch (err) {
      let message = 'Gagal memproses moderasi laporan.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal moderasi', description: message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadge(status: ReportStatus) {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Menunggu Tinjauan</Badge>;
      case 'action_taken':
        return <Badge variant="success">Ditindaklanjuti</Badge>;
      case 'dismissed':
        return <Badge variant="neutral">Diabaikan</Badge>;
      case 'reviewed':
        return <Badge variant="info">Ditinjau</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Dasbor Moderasi Komunitas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tinjau laporan pelanggaran, spam, dan potensi ancaman keamanan avatar.
          </p>
        </div>
      </div>

      {/* Filter Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: 'pending', label: 'Perlu Ditinjau' },
            { id: 'all', label: 'Semua Laporan' },
            { id: 'action_taken', label: 'Telah Ditindak' },
            { id: 'dismissed', label: 'Diabaikan' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              'rounded-full px-3.5 py-1 text-xs font-semibold transition-all shrink-0',
              filter === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'border border-border bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonList count={3} />}
      {error && (
        <ErrorState
          title="Gagal memuat antrean moderasi"
          description="Pastikan kamu memiliki hak akses Administrator untuk membuka halaman ini."
          onRetry={fetchReports}
        />
      )}

      {!loading && !error && reports.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-8 text-center bg-mint/30">
          <ShieldCheck className="size-9 text-primary mb-2" />
          <p className="font-bold text-sm text-foreground">Antrean Bersih</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tidak ada laporan pelanggaran aktif pada filter ini.
          </p>
        </Card>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col gap-3 bg-background border-border">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Target {report.targetType as string}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ({report.targetId})
                  </span>
                </div>
                {getStatusBadge(report.status as ReportStatus)}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-danger">
                  {REPORT_CATEGORY_LABELS[report.category as keyof typeof REPORT_CATEGORY_LABELS]}
                </span>
                <p className="text-xs text-foreground bg-mint/30 p-2.5 rounded-xl border border-border">
                  "{report.reason}"
                </p>
              </div>

              {report.moderatorNotes && (
                <div className="text-[11px] text-muted-foreground bg-muted p-2 rounded-lg">
                  <span className="font-semibold text-foreground">Catatan Moderator: </span>
                  {report.moderatorNotes}
                </div>
              )}

              {/* Tombol Tindakan Admin jika masih pending */}
              {report.status === 'pending' && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleOpenAction(report, 'action_taken', 'hide_activity')}
                  >
                    <ShieldAlert className="size-3.5" />
                    Batalkan / Sembunyikan Ajakan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAction(report, 'dismissed', 'none')}
                  >
                    <XCircle className="size-3.5" />
                    Abaikan Laporan
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tindakan Moderasi */}
      <Modal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title="Konfirmasi Tindakan Moderasi"
        footer={
          <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
            <Button
              loading={submitting}
              variant={actionStatus === 'action_taken' ? 'destructive' : 'primary'}
              onClick={handleModerateSubmit}
            >
              Simpan Tindakan
            </Button>
            <Button variant="ghost" onClick={() => setActionModalOpen(false)}>
              Batal
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Tindakan:{' '}
            <span className="font-bold text-foreground">
              {actionStatus === 'action_taken'
                ? 'Tindak Lanjuti (Batalkan/Sembunyikan & Kirim Konfirmasi ke Pelapor)'
                : 'Abaikan Laporan'}
            </span>
          </p>

          <div className="flex flex-col gap-1">
            <label htmlFor="mod-notes" className="text-xs font-bold text-foreground">
              Catatan Moderator / Audit Log
            </label>
            <textarea
              id="mod-notes"
              rows={2}
              placeholder="Tulis alasan keputusan moderasi untuk keperluan audit…"
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
