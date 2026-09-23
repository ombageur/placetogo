'use client';

import * as React from 'react';
import { Flag, ShieldAlert } from 'lucide-react';
import {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  type ReportCategory,
  type ReportTargetType,
} from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createReport, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetId: string;
  targetType: ReportTargetType;
  targetTitle?: string;
  onReportSubmitted: () => void;
}

export function ReportModal({
  open,
  onClose,
  targetId,
  targetType,
  targetTitle,
  onReportSubmitted,
}: ReportModalProps) {
  const { toast } = useToast();
  const [category, setCategory] = React.useState<ReportCategory>('inappropriate_content');
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 5) {
      toast({
        title: 'Penjelasan terlalu singkat',
        description: 'Mohon berikan penjelasan alasan pelaporan minimal 5 karakter.',
        variant: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await createReport({
        targetId,
        targetType,
        category,
        reason: reason.trim(),
      });

      setReason('');
      onReportSubmitted();
      onClose();
    } catch (err) {
      let message = 'Gagal mengirim laporan. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal melapor', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const targetLabel =
    targetType === 'activity' ? 'Ajakan' : targetType === 'user' ? 'Pengguna Avatar' : 'Pesan Obrolan';

  return (
    <Modal open={open} onClose={onClose} title={`Laporkan ${targetLabel}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Banner Keamanan */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-danger-soft/60 border border-danger/20 p-3 text-danger-soft-foreground">
          <ShieldAlert className="size-5 text-danger shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-foreground">Jaga Keamanan Komunitas Bersama</p>
            <p className="text-muted-foreground mt-0.5">
              Laporanmu bersifat rahasia dan akan ditinjau langsung oleh tim moderasi placetogo.
            </p>
          </div>
        </div>

        {targetTitle && (
          <div className="p-2.5 rounded-xl bg-mint/40 border border-border text-xs text-foreground">
            <span className="text-muted-foreground">Target: </span>
            <span className="font-bold">{targetTitle}</span>
          </div>
        )}

        {/* 1. Pilih Kategori Pelanggaran (Screen 28) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Alasan Pelaporan
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {REPORT_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              const faIconMap: Record<string, string> = {
                inappropriate_content: 'fa-eye-slash',
                harassment: 'fa-user-shield',
                spam: 'fa-bullhorn',
                scam: 'fa-triangle-exclamation',
                safety_concern: 'fa-shield-halved',
                other: 'fa-circle-question',
              };
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all',
                    isSelected
                      ? 'border-danger/40 bg-danger-soft/40 font-bold text-foreground shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:bg-mint/30 hover:text-foreground',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FaIcon icon={faIconMap[cat] ?? 'fa-flag'} className="text-xs text-danger" />
                    {REPORT_CATEGORY_LABELS[cat]}
                  </span>
                  <span
                    className={cn(
                      'size-3.5 rounded-full border flex items-center justify-center',
                      isSelected ? 'border-danger bg-danger' : 'border-border',
                    )}
                  >
                    {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Deskripsi Kronologi */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="report-reason" className="text-xs font-bold text-foreground uppercase tracking-wider">
            Penjelasan Tambahan
          </label>
          <textarea
            id="report-reason"
            rows={3}
            placeholder="Jelaskan secara singkat apa yang terjadi agar tim dapat menindaklanjuti dengan tepat…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-border-strong bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-danger"
          />
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            variant="destructive"
            size="lg"
            loading={loading}
            fullWidth
            className="shadow-sm"
          >
            <Flag className="size-4" />
            Kirim Laporan
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} fullWidth size="md">
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
