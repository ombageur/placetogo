'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Coins, ShieldCheck, Sparkles } from 'lucide-react';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TOPUP_PACKAGES,
  type PaymentMethod,
  type TopupPackageId,
} from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createTopup, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface TopupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TopupModal({ open, onClose }: TopupModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedPackageId, setSelectedPackageId] = React.useState<TopupPackageId>('pkg_50k');
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>('qris');
  const [loading, setLoading] = React.useState(false);

  const selectedPackage =
    TOPUP_PACKAGES.find((p) => p.id === selectedPackageId) ?? TOPUP_PACKAGES[0]!;

  async function handleProceed() {
    setLoading(true);
    try {
      const payment = await createTopup({
        packageId: selectedPackageId,
        paymentMethod: selectedMethod,
      });

      onClose();
      // Arahkan ke layar pembayaran / invoice
      router.push(`/dompet/bayar/${payment.orderId}`);
    } catch (err) {
      let message = 'Gagal memproses pesanan top-up. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal top-up', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Top Up Saldo Coin">
      <div className="flex flex-col gap-4">
        {/* Info Header */}
        <div className="flex items-center gap-3 rounded-2xl bg-warning-soft/70 border border-coin/30 p-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-coin/20 text-warning-soft-foreground shrink-0">
            <Coins className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Coin Komunitas Avatar</p>
            <p className="text-[11px] text-muted-foreground">
              Gunakan Coin untuk memberi apresiasi teman, membuka fitur komunitas, dan klaim voucher.
            </p>
          </div>
        </div>

        {/* 1. Pilih Paket Coin (Screen 25) */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            1. Pilih Paket Coin
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TOPUP_PACKAGES.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id as TopupPackageId)}
                  className={cn(
                    'relative flex flex-col p-3 rounded-2xl border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-mint shadow-sm'
                      : 'border-border bg-background hover:bg-mint/40',
                  )}
                >
                  {pkg.tag && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-xs">
                      {pkg.tag}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{pkg.label}</span>
                    <span className="text-xs font-extrabold text-primary">
                      Rp {pkg.priceIdr.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {pkg.bonusCoins > 0 ? (
                    <span className="text-[11px] text-primary/90 font-semibold mt-0.5 flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Total {pkg.totalCoins.toLocaleString('id-ID')} Coin (+{pkg.bonusCoins.toLocaleString('id-ID')} bonus)
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {pkg.totalCoins.toLocaleString('id-ID')} Coin
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Pilih Metode Pembayaran */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            2. Metode Pembayaran (DOKU Gateway)
          </span>
          <div className="grid grid-cols-1 gap-2">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-2xl border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-mint shadow-sm'
                      : 'border-border bg-background hover:bg-mint/40',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {method === 'qris' && <FaIcon icon="fa-qrcode" className="text-sm text-primary shrink-0" />}
                    {(method === 'bca_va' || method === 'mandiri_va' || method === 'bri_va') && <FaIcon icon="fa-building-columns" className="text-sm text-primary shrink-0" />}
                    {method === 'doku_checkout' && <FaIcon icon="fa-credit-card" className="text-sm text-primary shrink-0" />}
                    <span className="text-xs font-semibold text-foreground">
                      {PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'size-4 rounded-full border flex items-center justify-center',
                      isSelected ? 'border-primary bg-primary' : 'border-border',
                    )}
                  >
                    {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ringkasan & Tombol Pembayaran */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-mint/50 p-2.5 rounded-xl border border-primary/20">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span>Pembayaran terenkripsi dan aman melalui gateway resmi DOKU.</span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            size="lg"
            loading={loading}
            onClick={handleProceed}
            fullWidth
            className="shadow-md"
          >
            Lanjut Bayar Rp {selectedPackage.priceIdr.toLocaleString('id-ID')}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} fullWidth size="md">
            Batal
          </Button>
        </div>
      </div>
    </Modal>
  );
}
