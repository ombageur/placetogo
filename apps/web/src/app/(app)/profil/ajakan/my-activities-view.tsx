'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ActivityDoc } from '@placetogo/shared';
import { ActivityRow } from '@/components/activities/activity-row';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ActivityCardSkeletonList } from '@/components/activities/activity-card-skeleton';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { useDeferredEffect } from '@/hooks/use-mount-effect';
import { getMyActivities } from '@/lib/api';

type LoadState = { kind: 'loading' } | { kind: 'ready'; items: ActivityDoc[] } | { kind: 'error' };

/**
 * Ajakan yang dibuat pengguna, termasuk draft dan yang sudah lewat.
 *
 * Datanya diambil dari backend, bukan Firestore langsung, karena Security Rules hanya
 * mengizinkan klien membaca ajakan yang sudah terbit — draft milik sendiri tidak termasuk.
 */
export function MyActivitiesView() {
  const [state, setState] = React.useState<LoadState>({ kind: 'loading' });

  const load = React.useCallback(() => {
    void getMyActivities()
      .then((items) => setState({ kind: 'ready', items }))
      .catch(() => setState({ kind: 'error' }));
  }, []);

  useDeferredEffect(() => load(), [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href="/profil"
          aria-label="Kembali ke profil"
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-mint hover:text-primary"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-foreground">Ajakan Saya</h1>
      </div>

      {state.kind === 'loading' && <ActivityCardSkeletonList count={3} />}

      {state.kind === 'error' && (
        <ErrorState
          title="Tidak dapat memuat ajakan"
          description="Periksa koneksi internet kamu lalu coba lagi."
          onRetry={() => {
            setState({ kind: 'loading' });
            load();
          }}
        />
      )}

      {state.kind === 'ready' && state.items.length === 0 && (
        <EmptyState
          icon={<FaIcon icon="fa-calendar-plus" className="text-xl" />}
          title="Belum ada ajakan"
          description="Ajakan yang kamu buat akan muncul di sini."
        />
      )}

      {state.kind === 'ready' && state.items.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {state.items.length} ajakan yang kamu buat.
          </p>
          <div className="flex flex-col gap-2.5">
            {state.items.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        </>
      )}

      <Link href="/buat" className="pt-1">
        <Button size="lg" fullWidth>
          Buat ajakan baru
        </Button>
      </Link>
    </div>
  );
}
