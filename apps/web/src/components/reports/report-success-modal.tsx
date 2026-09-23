'use client';

import * as React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export interface ReportSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReportSuccessModal({ open, onClose }: ReportSuccessModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Laporan Diterima">
      <div className="flex flex-col items-center text-center p-2 gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-mint text-primary border border-primary/20">
          <ShieldCheck className="size-9" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
            <CheckCircle2 className="size-3.5" />
            Laporan Berhasil Terkirim
          </span>
          <h2 className="text-xl font-bold text-foreground mt-1">Terima Kasih!</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Kontribusimu sangat berarti dalam menjaga keamanan dan kenyamanan ekosistem komunitas placetogo. Tim kami akan segera meninjau laporan ini.
          </p>
        </div>

        <div className="flex flex-col w-full gap-2 pt-2">
          <Button fullWidth size="md" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    </Modal>
  );
}
