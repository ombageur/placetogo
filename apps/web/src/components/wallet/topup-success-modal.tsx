'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Coins, Compass, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export interface TopupSuccessModalProps {
  open: boolean;
  onClose: () => void;
  coinAmount: number;
}

export function TopupSuccessModal({ open, onClose, coinAmount }: TopupSuccessModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Top Up Berhasil">
      <div className="flex flex-col items-center text-center p-2 gap-4">
        {/* Golden Celebration Icon */}
        <div className="flex size-20 items-center justify-center rounded-full bg-warning-soft border-2 border-coin/40 text-warning-soft-foreground">
          <Coins className="size-11 animate-bounce" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
            <CheckCircle2 className="size-3.5" />
            Pembayaran Berhasil
          </span>
          <h2 className="text-2xl font-extrabold text-foreground mt-1">
            +{coinAmount.toLocaleString('id-ID')} Coin
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Saldo Coin telah otomatis masuk ke dompet kamu dan siap digunakan untuk aktivitas komunitas!
          </p>
        </div>

        <div className="flex flex-col w-full gap-2 pt-2">
          <Link href="/dompet" className="w-full" onClick={onClose}>
            <Button fullWidth size="md">
              <Wallet className="size-4" />
              Lihat Saldo Dompet
            </Button>
          </Link>
          <Link href="/jelajah" className="w-full" onClick={onClose}>
            <Button fullWidth size="md" variant="outline" className="bg-background">
              <Compass className="size-4" />
              Cari Teman & Ajakan Baru
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
