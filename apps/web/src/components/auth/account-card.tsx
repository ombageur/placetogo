'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from './auth-provider';

export function AccountCard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSignOut() {
    setLoading(true);
    await signOut();
    router.replace('/masuk');
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={user?.email ?? 'Akun'} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">Masuk sebagai</p>
          <p className="truncate font-semibold" data-testid="account-email">
            {user?.email}
          </p>
        </div>
      </div>
      <Button variant="outline" fullWidth loading={loading} onClick={onSignOut}>
        <LogOut className="size-4" aria-hidden="true" />
        Keluar
      </Button>
    </Card>
  );
}
