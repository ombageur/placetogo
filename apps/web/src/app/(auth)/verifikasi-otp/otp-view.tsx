'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';

export function OtpView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') || '+62 812 3456 7890';
  const { refreshAccount } = useAuth();

  const [digits, setDigits] = React.useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState(45);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function handleDigitChange(index: number, value: string) {
    // Hanya ambil angka
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    // Jika paste kode 6 digit
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const updated = [...digits];
      pasted.forEach((char, i) => {
        if (i < 6) updated[i] = char;
      });
      setDigits(updated);
      const nextIdx = Math.min(5, pasted.length);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...digits];
    updated[index] = clean.slice(-1);
    setDigits(updated);

    // Auto advance focus ke kotak berikutnya
    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Simpan status verifikasi di sesi lokal
      sessionStorage.setItem('placetogo_phone_verified', 'true');
      await refreshAccount();
      
      // Lanjut ke Screen 8 (Pilih Avatar)
      router.push('/onboarding/avatar');
    } catch {
      setError('Kode OTP tidak valid atau kedaluwarsa. Coba lagi.');
      setLoading(false);
    }
  }

  function handleResend() {
    if (countdown > 0) return;
    setCountdown(45);
    setDigits(['', '', '', '', '', '']);
    setError(null);
    inputRefs.current[0]?.focus();
  }

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Tombol Kembali */}
      <Link
        href="/daftar"
        className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-mint hover:text-primary transition-colors -ml-2"
        aria-label="Kembali ke pendaftaran"
      >
        <FaIcon icon="fa-chevron-left" className="text-sm" />
      </Link>

      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="tracking-tight text-foreground">
          Masukkan kode OTP
        </h1>
        <p className="text-xs text-muted-foreground">
          Kode telah dikirim ke <span className="font-semibold text-foreground">{phoneParam}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col items-center gap-6">
        {/* 6 Digit Input Boxes */}
        <div className="flex justify-center gap-2 sm:gap-2.5">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              aria-label={`Digit ke-${index + 1} dari ${digits.length}`}
              value={digit}
              autoFocus={index === 0}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                'size-12 sm:size-14 rounded-2xl border text-center text-xl font-bold transition-all shadow-xs outline-none',
                digit
                  ? 'border-primary bg-mint/30 text-primary ring-2 ring-primary/20'
                  : 'border-border-strong bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
              )}
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-danger flex items-center gap-1.5">
            <FaIcon icon="fa-triangle-exclamation" className="text-xs" />
            <span>{error}</span>
          </p>
        )}

        {/* Kirim Ulang Countdown */}
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <p>Tidak menerima kode?</p>
          <button
            type="button"
            disabled={countdown > 0}
            onClick={handleResend}
            className={cn(
              'font-semibold transition-colors min-h-11 inline-flex items-center',
              countdown > 0
                ? 'text-muted-foreground opacity-60 cursor-not-allowed'
                : 'text-primary underline hover:text-secondary',
            )}
          >
            {countdown > 0
              ? `Kirim ulang (00:${String(countdown).padStart(2, '0')})`
              : 'Kirim ulang sekarang'}
          </button>
        </div>

        {/* Tombol Verifikasi */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!isComplete}
          className="mt-2"
        >
          Verifikasi
        </Button>
      </form>
    </div>
  );
}
