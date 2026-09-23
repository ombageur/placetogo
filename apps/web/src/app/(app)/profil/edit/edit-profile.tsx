'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { MyProfile } from '@placetogo/shared';
import { ProfileForm } from '@/components/profile/profile-form';
import { ErrorState } from '@/components/ui/states';
import { SkeletonList } from '@/components/ui/skeleton';
import { getMyProfile } from '@/lib/api';

import { useAuth } from '@/components/auth/auth-provider';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

const DEFAULT_PROFILE: MyProfile = {
  displayName: 'Teman PlaceToGo',
  avatarId: 'cat',
  bio: 'Temukan teman dan tempat seru di sekitarmu.',
  cityId: 'jakarta',
  cityVisible: true,
  interests: ['ngobrol', 'kuliner', 'olahraga'],
};

type LoadState = { kind: 'loading' } | { kind: 'ready'; profile: MyProfile } | { kind: 'error' };

export function EditProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = React.useState<LoadState>({ kind: 'loading' });

  const load = React.useCallback(async () => {
    try {
      const profile = await getMyProfile();
      if (profile) {
        setState({ kind: 'ready', profile });
      } else {
        setState({
          kind: 'ready',
          profile: {
            ...DEFAULT_PROFILE,
            displayName: user?.displayName || DEFAULT_PROFILE.displayName,
          },
        });
      }
    } catch (err) {
      console.warn('Gagal memuat profil untuk diedit, menggunakan fallback:', err);
      setState({
        kind: 'ready',
        profile: {
          ...DEFAULT_PROFILE,
          displayName: user?.displayName || DEFAULT_PROFILE.displayName,
        },
      });
    }
  }, [user]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setState({ kind: 'loading' });
    void load();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1>Edit profil</h1>
      {state.kind === 'loading' && <SkeletonList count={3} />}
      {state.kind === 'error' && <ErrorState description="Tidak dapat memuat profil kamu." onRetry={retry} />}
      {state.kind === 'ready' && (
        <ProfileForm initial={state.profile} submitLabel="Simpan" onSaved={() => router.push('/profil')} />
      )}
    </div>
  );
}
