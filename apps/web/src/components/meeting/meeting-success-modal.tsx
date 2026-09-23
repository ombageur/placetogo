'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Compass, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export interface MeetingSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function MeetingSuccessModal({ open, onClose }: MeetingSuccessModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Pertemuan Selesai">
      <div className="flex flex-col items-center text-center p-2 gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-mint text-primary">
          <CheckCircle2 className="size-10" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">Terima kasih!</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Semoga pertemuan ini menjadi awal dari lebih banyak teman baru dan cerita seru.
          </p>
        </div>

        <div className="flex flex-col w-full gap-2 pt-2">
          <Link href="/profil" className="w-full">
            <Button fullWidth size="md" variant="outline" className="bg-background">
              <History className="size-4" />
              Lihat Riwayat Aktivitas
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button fullWidth size="md">
              <Compass className="size-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
