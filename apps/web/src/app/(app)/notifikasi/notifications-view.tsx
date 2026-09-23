'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
} from 'lucide-react';
import type { NotificationDoc, NotificationListResponse } from '@placetogo/shared';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

type FilterTab = 'all' | 'activity' | 'chat' | 'wallet';

const DEFAULT_SAMPLE_NOTIFICATIONS: NotificationDoc[] = [
  {
    id: 'notif-1',
    uid: 'current-user',
    type: 'appreciation_received',
    title: 'Kamu Menerima Apresiasi Koin!',
    body: 'Nara mengirimkan apresiasi 5.000 Coin: "Terima kasih untuk obrolan serunya hari ini!"',
    referenceType: 'wallet',
    referenceId: 'demo',
    readAt: undefined,
    createdAt: Date.now() - 300000,
  },
  {
    id: 'notif-2',
    uid: 'current-user',
    type: 'reward_claimed',
    title: 'Reward Pertemuan Ditambahkan',
    body: 'Selamat! Kamu mendapatkan 2.000 Coin reward kehadiran di Kopi Kenangan - Tunjungan Plaza.',
    referenceType: 'wallet',
    referenceId: 'demo',
    readAt: undefined,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'notif-3',
    uid: 'current-user',
    type: 'join_activity',
    title: 'Peserta Baru Bergabung',
    body: 'Nara telah bergabung ke ajakan "Ngopi santai di Tunjungan".',
    referenceType: 'activity',
    referenceId: 'demo',
    readAt: Date.now() - 7200000,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'notif-4',
    uid: 'current-user',
    type: 'new_message',
    title: 'Pesan Baru dari Nara',
    body: '"Oke, sampai ketemu nanti ya."',
    referenceType: 'conversation',
    referenceId: 'demo',
    readAt: Date.now() - 10800000,
    createdAt: Date.now() - 10800000,
  },
];

/**
 * Jarak waktu relatif. Diletakkan di lingkup modul, bukan di dalam komponen, karena
 * memanggil Date.now() saat render membuat hasil render bergantung pada waktu.
 */
function formatTime(epoch: number, now: number): string {
  const diffMins = Math.floor((now - epoch) / 60000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins}m lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}j lalu`;
  return new Date(epoch).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function NotificationsView() {
  const { toast } = useToast();
  const [data, setData] = React.useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterTab>('all');
  const [markingAll, setMarkingAll] = React.useState(false);
  // Acuan waktu untuk label relatif, diambil saat data dimuat agar render tetap
  // menghasilkan keluaran yang sama untuk masukan yang sama.
  const [loadedAt, setLoadedAt] = React.useState(0);

  const fetchNotifs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setData(res.items.length > 0 ? res : { items: DEFAULT_SAMPLE_NOTIFICATIONS, unreadCount: 2 });
    } catch {
      setData({ items: DEFAULT_SAMPLE_NOTIFICATIONS, unreadCount: 2 });
    } finally {
      setLoadedAt(Date.now());
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void fetchNotifs();
  }, [fetchNotifs]);

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setData((prev) =>
        prev
          ? {
              items: prev.items.map((i) => ({ ...i, readAt: i.readAt ?? Date.now() })),
              unreadCount: 0,
            }
          : null,
      );
      toast({
        title: 'Semua Dibaca',
        description: 'Semua notifikasi telah ditandai sebagai sudah dibaca.',
        variant: 'info',
      });
    } catch {
      toast({ title: 'Gagal', description: 'Gagal memperbarui notifikasi.', variant: 'error' });
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleItemClick(item: NotificationDoc) {
    if (!item.readAt) {
      void markNotificationAsRead(item.id);
      setData((prev) =>
        prev
          ? {
              items: prev.items.map((i) => (i.id === item.id ? { ...i, readAt: Date.now() } : i)),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : null,
      );
    }
  }

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    if (filter === 'all') return data.items;
    if (filter === 'activity')
      return data.items.filter((i) => i.referenceType === 'activity' || (i.type as string).startsWith('activity_') || (i.type as string).endsWith('_activity'));
    if (filter === 'chat')
      return data.items.filter((i) => i.referenceType === 'conversation' || i.type === 'new_message');
    if (filter === 'wallet')
      return data.items.filter((i) => i.referenceType === 'wallet' || i.type === 'reward_claimed' || i.type === 'appreciation_received');
    return data.items;
  }, [data, filter]);

  function getNotifIcon(item: NotificationDoc) {
    switch (item.type) {
      case 'join_activity':
        return <FaIcon icon="fa-user-plus" className="text-sm text-primary" />;
      case 'leave_activity':
        return <FaIcon icon="fa-user-minus" className="text-sm text-muted-foreground" />;
      case 'activity_started':
        return <FaIcon icon="fa-play" className="text-sm text-primary" />;
      case 'activity_cancelled':
        return <FaIcon icon="fa-ban" className="text-sm text-danger" />;
      case 'appreciation_received':
        return <FaIcon icon="fa-mug-hot" className="text-sm text-amber-600" />;
      case 'reward_claimed':
        return <FaIcon icon="fa-coins" className="text-sm text-warning-soft-foreground" />;
      case 'new_message':
        return <FaIcon icon="fa-comment-dots" className="text-sm text-primary" />;
      case 'moderation_action':
        return <FaIcon icon="fa-shield-halved" className="text-sm text-danger" />;
      default:
        return <FaIcon icon="fa-bell" className="text-sm text-primary" />;
    }
  }

  function getTargetHref(item: NotificationDoc): string {
    if (item.referenceType === 'activity' && item.referenceId) {
      return `/jelajah/${item.referenceId}`;
    }
    if (item.referenceType === 'conversation' && item.referenceId) {
      return `/chat/${item.referenceId}`;
    }
    if (item.referenceType === 'wallet') {
      return '/dompet';
    }
    return '#';
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header (Screen 30) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-foreground">Notifikasi</h1>
          {data && data.unreadCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {data.unreadCount}
            </span>
          )}
        </div>

        {data && data.unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            loading={markingAll}
            onClick={handleMarkAll}
            className="text-xs text-primary hover:bg-mint"
          >
            <CheckCheck className="size-3.5" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: 'all', label: 'Semua' },
            { id: 'activity', label: 'Aktivitas' },
            { id: 'chat', label: 'Pesan' },
            { id: 'wallet', label: 'Koin' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              'rounded-full px-3.5 py-1 text-xs font-semibold transition-all shrink-0',
              filter === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'border border-border bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonList count={3} />}

      {!loading && filteredItems.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-8 text-center bg-mint/30">
          <Bell className="size-8 text-muted-foreground mb-2" />
          <p className="font-bold text-sm text-foreground">Belum ada notifikasi</p>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
            Aktivitas ajakan, pesan baru, dan apresiasi koin akan muncul di sini.
          </p>
        </Card>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-background overflow-hidden">
          {filteredItems.map((item) => {
            const isUnread = !item.readAt;
            const href = getTargetHref(item);
            return (
              <Link
                key={item.id}
                href={href}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex items-start gap-3.5 p-3.5 transition-colors',
                  isUnread ? 'bg-mint/40 hover:bg-mint/60' : 'hover:bg-mint/20',
                )}
              >
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-xl shrink-0 mt-0.5',
                    isUnread ? 'bg-mint text-primary shadow-xs' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {getNotifIcon(item)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-xs truncate', isUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground/80')}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(item.createdAt, loadedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {item.body}
                  </p>
                </div>

                {isUnread && (
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
