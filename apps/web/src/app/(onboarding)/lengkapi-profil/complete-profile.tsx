'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileForm } from '@/components/profile/profile-form';
import { useAuth } from '@/components/auth/auth-provider';

export function CompleteProfile() {
  const router = useRouter();
  const { refreshAccount } = useAuth();

  async function onSaved() {
    await refreshAccount(); // stage berubah menjadi 'ready' setelah user_private diperbarui
    router.replace('/');
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1>Lengkapi profil</h1>
        <p className="text-sm text-muted-foreground">Ini yang akan dilihat calon teman aktivitasmu.</p>
      </div>
      <ProfileForm submitLabel="Lanjut" onSaved={onSaved} />
    </>
  );
}
