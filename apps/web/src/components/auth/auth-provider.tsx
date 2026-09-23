'use client';

import * as React from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import type { AccountState } from '@placetogo/shared';
import { getFirebase } from '@/lib/firebase';
import { getPublicEnv } from '@/lib/env';
import { loadAccount } from '@/lib/api';

export type AccountStatus =
  | { kind: 'loading' }
  | { kind: 'ready'; account: AccountState }
  | { kind: 'error' };

export interface AuthContextValue {
  status: 'loading' | 'signed-out' | 'signed-in' | 'config-error';
  user: User | null;
  account: AccountStatus;
  /** Memuat ulang pengguna + token (mis. setelah verifikasi email) lalu kondisi akun. */
  refreshAccount: () => Promise<AccountState | null>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function isConfigValid(): boolean {
  try {
    getPublicEnv();
    return true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [configOk] = React.useState(isConfigValid);
  const [status, setStatus] = React.useState<'loading' | 'signed-out' | 'signed-in'>('loading');
  const [user, setUser] = React.useState<User | null>(null);
  const [account, setAccount] = React.useState<AccountStatus>({ kind: 'loading' });
  // Mencegah hasil permintaan lama menimpa pengguna yang sudah berganti.
  const generation = React.useRef(0);

  const fetchAccount = React.useCallback(async (): Promise<AccountState | null> => {
    const mine = ++generation.current;
    try {
      const next = await loadAccount();
      if (mine !== generation.current) return null;
      setAccount({ kind: 'ready', account: next });
      return next;
    } catch {
      if (mine === generation.current) setAccount({ kind: 'error' });
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!configOk) return;
    return onAuthStateChanged(getFirebase().auth, (next) => {
      generation.current++;
      setUser(next);
      if (!next) {
        setAccount({ kind: 'loading' });
        setStatus('signed-out');
        return;
      }
      setAccount({ kind: 'loading' });
      setStatus('signed-in');
      void fetchAccount();
    });
  }, [configOk, fetchAccount]);

  const refreshAccount = React.useCallback(async () => {
    const current = getFirebase().auth.currentUser;
    if (!current) return null;
    // Akun yang sudah dimuat tetap ditampilkan selama pembaruan latar (tanpa memunculkan layar pemuat).
    try {
      await current.reload();
      await current.getIdToken(true); // klaim email_verified pada token ikut diperbarui
    } catch {
      setAccount({ kind: 'error' });
      return null;
    }
    return fetchAccount();
  }, [fetchAccount]);

  const signOut = React.useCallback(async () => {
    await firebaseSignOut(getFirebase().auth);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status: configOk ? status : 'config-error',
      user,
      account,
      refreshAccount,
      signOut,
    }),
    [configOk, status, user, account, refreshAccount, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
