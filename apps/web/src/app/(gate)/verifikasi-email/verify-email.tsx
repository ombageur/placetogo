'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { MailCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { authErrorMessage, errorCodeOf } from '@/lib/auth/errors';
import { routeForStage } from '@/lib/auth/routes';
import { useCooldown } from '@/hooks/use-cooldown';

const COOLDOWN_SECONDS = 60;

export function VerifyEmail() {
  const { user, account, refreshAccount, signOut } = useAuth();
  const router = useRouter();
  const [remaining, startCooldown] = useCooldown(COOLDOWN_SECONDS);
  const [message, setMessage] = React.useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const stage = account.kind === 'ready' ? account.account.stage : null;

  // Sudah terverifikasi (mis. dari tab lain): lanjutkan sesuai tahap akun.
  React.useEffect(() => {
    if (stage && stage !== 'verify_email') router.replace(routeForStage(stage));
  }, [stage, router]);

  const check = React.useCallback(async () => {
    setChecking(true);
    const next = await refreshAccount();
    setChecking(false);
    if (next && next.stage === 'verify_email') {
      setMessage({ kind: 'error', text: 'Email belum terverifikasi. Buka tautan di email kamu lalu coba lagi.' });
    }
  }, [refreshAccount]);

  // Kembali ke tab ini setelah membuka tautan di email: periksa otomatis.
  React.useEffect(() => {
    const onFocus = () => void refreshAccount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshAccount]);

  async function resend() {
    if (!user) return;
    setMessage(null);
    setSending(true);
    try {
      await sendEmailVerification(user);
      setMessage({ kind: 'ok', text: 'Email verifikasi dikirim ulang. Periksa kotak masuk dan folder spam.' });
      startCooldown();
    } catch (err) {
      setMessage({ kind: 'error', text: authErrorMessage(errorCodeOf(err), 'verify') ?? 'Gagal mengirim email.' });
    }
    setSending(false);
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-mint text-primary" aria-hidden="true">
          <MailCheck className="size-10" />
        </div>
        <h1 className="">Verifikasi email kamu</h1>
        <p className="text-sm text-muted-foreground">
          Kami mengirim tautan verifikasi ke <strong className="break-all text-foreground">{user?.email}</strong>. Buka tautan itu, lalu kembali ke sini.
        </p>
      </div>

      <div aria-live="polite">
        {message && (
          <p
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={`rounded-xl px-4 py-3 text-sm font-medium ${message.kind === 'error' ? 'bg-danger-soft text-danger-soft-foreground' : 'bg-mint text-primary'}`}
          >
            {message.text}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Button fullWidth size="lg" loading={checking} onClick={check}>
          Saya sudah verifikasi
        </Button>
        <Button variant="secondary" fullWidth loading={sending} disabled={remaining > 0} onClick={resend}>
          {remaining > 0 ? `Kirim ulang dalam ${remaining} dtk` : 'Kirim ulang email'}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => void signOut()}>
          Keluar
        </Button>
      </div>
    </>
  );
}
