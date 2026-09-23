'use client';

import * as React from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  WITHDRAWAL_METHODS,
  WITHDRAWAL_METHOD_LABELS,
  type WithdrawalMethod,
} from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createWithdrawal, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface WithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  availableEarningsIdr: number;
  onSuccess?: (withdrawnAmount: number) => void;
}

const MIN_WITHDRAWAL_IDR = 20000;

export function WithdrawalModal({
  open,
  onClose,
  availableEarningsIdr,
  onSuccess,
}: WithdrawalModalProps) {
  const { toast } = useToast();

  const [method, setMethod] = React.useState<WithdrawalMethod>('bca');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [amountStr, setAmountStr] = React.useState('50000');
  const [loading, setLoading] = React.useState(false);
  const [successState, setSuccessState] = React.useState<{
    amount: number;
    methodLabel: string;
    account: string;
  } | null>(null);

  const amount = Number(amountStr) || 0;
  const isEwallet = ['gopay', 'ovo', 'dana', 'shopeepay'].includes(method);

  function handleQuickAmount(val: number) {
    const target = Math.min(val, availableEarningsIdr);
    setAmountStr(String(target));
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();

    if (amount < MIN_WITHDRAWAL_IDR) {
      toast({
        title: 'Nominal tidak valid',
        description: `Minimal penarikan adalah Rp${MIN_WITHDRAWAL_IDR.toLocaleString('id-ID')}`,
        variant: 'error',
      });
      return;
    }

    if (amount > availableEarningsIdr) {
      toast({
        title: 'Saldo tidak mencukupi',
        description: `Saldo penghasilan kamu saat ini Rp${availableEarningsIdr.toLocaleString(
          'id-ID',
        )}`,
        variant: 'error',
      });
      return;
    }

    if (!accountNumber.trim()) {
      toast({
        title: 'Data belum lengkap',
        description: isEwallet
          ? 'Masukkan nomor HP akun e-wallet kamu'
          : 'Masukkan nomor rekening bank kamu',
        variant: 'error',
      });
      return;
    }

    if (!accountName.trim()) {
      toast({
        title: 'Data belum lengkap',
        description: 'Masukkan nama pemilik rekening / akun',
        variant: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      await createWithdrawal({
        amountIdr: amount,
        method,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });

      setSuccessState({
        amount,
        methodLabel: WITHDRAWAL_METHOD_LABELS[method],
        account: `${accountNumber} a.n. ${accountName}`,
      });

      if (onSuccess) onSuccess(amount);

      toast({
        title: 'Permintaan Tarik Dana Berhasil! 🎉',
        description: `Penarikan Rp${amount.toLocaleString('id-ID')} berhasil diajukan dan saldo penghasilan kamu telah dipotong.`,
      });
    } catch (err: unknown) {
      let errMsg = 'Terjadi gangguan jaringan, silakan coba lagi.';
      if (err instanceof ApiError && err.message) {
        errMsg = err.message;
      }
      toast({
        title: 'Gagal memproses',
        description: errMsg,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleResetAndClose() {
    setSuccessState(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleResetAndClose} title="Tarik Dana Penghasilan">
      {successState ? (
        <div className="flex flex-col items-center text-center gap-4 py-3">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 animate-in zoom-in">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-foreground">Permintaan Berhasil Dibuat</h3>
            <p className="text-2xl font-extrabold text-emerald-600">
              Rp{successState.amount.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Dana akan ditransfer ke <strong className="text-foreground">{successState.methodLabel}</strong> ({successState.account}) dalam 1x24 jam kerja.
            </p>
          </div>

          <div className="w-full rounded-2xl bg-muted/40 border border-border p-3.5 text-xs text-muted-foreground text-left flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-amber-600">Diproses</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Admin:</span>
              <span className="font-bold text-emerald-600">Gratis (Rp0)</span>
            </div>
          </div>

          <Button size="lg" className="w-full mt-2" onClick={handleResetAndClose}>
            Selesai
          </Button>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
          {/* Card Info Saldo Penghasilan */}
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3.5 dark:bg-emerald-950/20 dark:border-emerald-900/40">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Penghasilan Tersedia
              </span>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                Rp{availableEarningsIdr.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              <Banknote className="size-6" />
            </div>
          </div>

          {/* 1. Pilih Metode Penarikan */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              1. Pilih Bank / E-Wallet Tujuan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WITHDRAWAL_METHODS.map((m) => {
                const isSelected = method === m;
                const isEw = ['gopay', 'ovo', 'dana', 'shopeepay'].includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all',
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-border bg-background hover:bg-muted/40 text-foreground',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-7 items-center justify-center rounded-lg text-xs shrink-0',
                        isEw ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700',
                      )}
                    >
                      {isEw ? <Smartphone className="size-3.5" /> : <Building2 className="size-3.5" />}
                    </div>
                    <span className="truncate">{WITHDRAWAL_METHOD_LABELS[m]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Informasi Rekening / Akun */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              2. Data Rekening Penerima
            </label>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {isEwallet ? 'Nomor HP E-Wallet' : 'Nomor Rekening Bank'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={isEwallet ? 'Contoh: 081234567890' : 'Contoh: 1234567890'}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nama Lengkap Pemilik Rekening / Akun
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Sesuai nama terdaftar di bank/e-wallet"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* 3. Nominal Penarikan */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                3. Nominal Penarikan (Rp)
              </label>
              <span className="text-[11px] text-muted-foreground">Min. Rp20.000</span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted-foreground">
                Rp
              </span>
              <input
                type="number"
                min={MIN_WITHDRAWAL_IDR}
                max={availableEarningsIdr}
                step={5000}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2 text-base font-extrabold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center gap-1.5 pt-1">
              {[20000, 50000, 100000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  disabled={val > availableEarningsIdr}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Rp{(val / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickAmount(availableEarningsIdr)}
                disabled={availableEarningsIdr < MIN_WITHDRAWAL_IDR}
                className="rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
              >
                Tarik Semua
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Penarikan diproses otomatis ke rekening/e-wallet terdaftar tanpa potongan biaya admin.
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={loading || amount < MIN_WITHDRAWAL_IDR || amount > availableEarningsIdr}
            >
              {loading ? 'Memproses...' : 'Tarik Dana Sekarang'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
