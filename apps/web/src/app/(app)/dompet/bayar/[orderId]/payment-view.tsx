'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  PAYMENT_METHOD_LABELS,
  type PaymentDoc,
} from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/states';
import { SkeletonList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getPayment, simulatePaymentSuccess, ApiError } from '@/lib/api';
import { TopupSuccessModal } from '@/components/wallet/topup-success-modal';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

export function PaymentView({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const [payment, setPayment] = React.useState<PaymentDoc | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [simulating, setSimulating] = React.useState(false);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);

  /*
   * Status terakhir disimpan di ref, bukan dibaca dari state di dalam efek.
   * Sebelumnya `payment` ikut menjadi dependensi efek padahal efeknya langsung memanggil
   * fetch: setiap respons menghasilkan objek baru, dependensinya berubah, dan efeknya
   * berjalan lagi tanpa henti. Akibatnya halaman ini menembak GET /v1/payments ratusan kali
   * dalam beberapa detik sampai kena batas laju, lalu tampil sebagai "Pesanan tidak ditemukan".
   */
  const statusRef = React.useRef<PaymentDoc['status'] | null>(null);
  const loadedRef = React.useRef(false);

  const fetchPayment = React.useCallback(async () => {
    try {
      const data = await getPayment(orderId);
      statusRef.current = data.status;
      loadedRef.current = true;
      setPayment(data);
      setError(false);
      if (data.status === 'paid') {
        setOpenSuccessModal(true);
      }
    } catch {
      // Kegagalan saat polling tidak boleh menghapus invoice yang sudah tampil;
      // hanya kegagalan pemuatan pertama yang ditampilkan sebagai galat.
      if (!loadedRef.current) setError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useDeferredEffect(() => {
    void fetchPayment();
  }, [fetchPayment]);

  // Polling status setiap 4 detik selama pembayaran masih menunggu.
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current === 'pending') void fetchPayment();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchPayment]);

  function copyText(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast({
      title: 'Tersalin ke papan klip',
      description: `${label} berhasil disalin.`,
      variant: 'info',
    });
  }

  async function handleSimulate() {
    setSimulating(true);
    try {
      const updated = await simulatePaymentSuccess(orderId);
      setPayment(updated);
      setOpenSuccessModal(true);
      toast({
        title: 'Pembayaran Berhasil!',
        description: `Top-up sebesar ${updated.coinAmount.toLocaleString('id-ID')} Coin telah aktif.`,
        variant: 'success',
      });
    } catch (err) {
      let message = 'Gagal memproses simulasi pembayaran.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Simulasi gagal', description: message, variant: 'error' });
    } finally {
      setSimulating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonList count={2} />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dompet" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" />
          Kembali ke Dompet
        </Link>
        <ErrorState
          title="Pesanan tidak ditemukan"
          description="Invoice pesanan pembayaran tidak dapat dimuat."
          onRetry={fetchPayment}
        />
      </div>
    );
  }

  const isPaid = payment.status === 'paid';
  const isQris = payment.paymentMethod === 'qris';

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto">
      <Link href="/dompet" className="inline-flex items-center gap-1 text-sm font-semibold text-primary self-start">
        <ArrowLeft className="size-4" />
        Kembali ke Dompet
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Pembayaran</h1>
        <Badge variant={isPaid ? 'success' : 'warning'}>
          {isPaid ? 'Lunas' : 'Menunggu Pembayaran'}
        </Badge>
      </div>

      {/* Invoice Card (Screen 26) */}
      <Card className="flex flex-col gap-4 bg-background">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="text-[11px] text-muted-foreground">Nomor Pesanan</span>
            <p className="font-mono text-xs font-bold text-foreground">{payment.orderId}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground">Total Tagihan</span>
            <p className="text-base font-extrabold text-primary">
              Rp {payment.amountIdr.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Paket Coin */}
        <div className="flex items-center justify-between bg-mint/50 p-3 rounded-2xl border border-primary/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <p className="font-bold text-xs text-foreground">Paket Coin Avatar</p>
              <p className="text-[11px] text-muted-foreground">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? payment.paymentMethod}
              </p>
            </div>
          </div>
          <span className="font-bold text-sm text-primary">
            +{payment.coinAmount.toLocaleString('id-ID')} Coin
          </span>
        </div>

        {/* Instruksi Pembayaran Sesuai Metode */}
        {!isPaid && (
          <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-mint/30 border border-border">
            {isQris ? (
              <>
                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <QrCode className="size-4 text-primary" />
                  Pindai QRIS dengan Aplikasi Pembayaran
                </div>

                {/* Simulated QR Code Frame */}
                <div className="flex size-48 flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-inner border-2 border-primary/30">
                  <div className="grid grid-cols-4 gap-1.5 size-full p-2 bg-slate-900 rounded-lg">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={i % 3 === 0 ? 'bg-mint rounded-xs' : 'bg-white rounded-xs'}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center max-w-xs">
                  Buka aplikasi GoPay, OVO, Dana, BCA Mobile, atau e-wallet lainnya untuk memindai QRIS di atas.
                </p>
              </>
            ) : payment.vaNumber ? (
              <div className="w-full flex flex-col gap-2">
                <span className="text-xs font-bold text-foreground">Nomor Virtual Account</span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                  <span className="font-mono text-base font-bold text-primary tracking-wider">
                    {payment.vaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(payment.vaNumber!, 'Nomor Virtual Account')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Copy className="size-3.5" />
                    Salin
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Transfer tepat nominal Rp {payment.amountIdr.toLocaleString('id-ID')} ke nomor VA di atas.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-foreground">
                <CreditCard className="size-4 text-primary" />
                <span>Silakan selesaikan pembayaran melalui portal gateway DOKU.</span>
              </div>
            )}

            {/* Timer countdown reminder */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Clock className="size-3.5 text-warning-soft-foreground" />
              <span>Selesaikan pembayaran dalam 60 menit</span>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-success-soft text-success text-center border border-success/30">
            <CheckCircle2 className="size-10" />
            <p className="font-bold text-sm">Pembayaran Telah Diterima</p>
            <p className="text-xs text-muted-foreground">
              +{payment.coinAmount.toLocaleString('id-ID')} Coin telah dikreditkan ke saldo akun kamu.
            </p>
          </div>
        )}

        {/* Tombol Simulasi Pembayaran Sandbox */}
        {!isPaid && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold">
              <Zap className="size-3.5" />
              Mode Sandbox / Pengujian Developer
            </div>
            <Button
              type="button"
              size="lg"
              variant="outline"
              loading={simulating}
              onClick={handleSimulate}
              className="bg-mint border-primary/40 text-primary font-bold hover:bg-mint-strong"
            >
              Simulasi Bayar Berhasil (Sandbox)
            </Button>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground justify-center">
        <ShieldCheck className="size-4 text-primary shrink-0" />
        <span>Keamanan transaksi dilindungi oleh standar enkripsi perbankan DOKU.</span>
      </div>

      {/* Modal Sukses (Screen 27) */}
      <TopupSuccessModal
        open={openSuccessModal}
        onClose={() => setOpenSuccessModal(false)}
        coinAmount={payment.coinAmount}
      />
    </div>
  );
}
