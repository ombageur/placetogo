'use client';

import * as React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { Button } from '@/components/ui/button';
import { getFirebase } from '@/lib/firebase';
import { getPublicEnv } from '@/lib/env';
import { authErrorMessage, errorCodeOf } from '@/lib/auth/errors';

/**
 * Tampil hanya bila NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true, yaitu setelah provider Google
 * dikonfigurasi di Firebase Console (domain resmi + OAuth client). Tanpa itu, tidak dirender.
 */
export function GoogleButton({ onError }: { onError: (message: string | null) => void }) {
  const [loading, setLoading] = React.useState(false);
  if (getPublicEnv().NEXT_PUBLIC_AUTH_GOOGLE_ENABLED !== 'true') return null;

  async function signIn() {
    onError(null);
    setLoading(true);
    try {
      await signInWithPopup(getFirebase().auth, new GoogleAuthProvider());
    } catch (err) {
      onError(authErrorMessage(errorCodeOf(err), 'google'));
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        atau
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" fullWidth loading={loading} onClick={signIn} className="flex items-center justify-center gap-2">
        <FaIcon icon="fa-brands fa-google" className="text-primary text-base" />
        <span>Lanjutkan dengan Google</span>
      </Button>
    </>
  );
}
