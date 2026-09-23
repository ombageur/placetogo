'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { MessageSquare, Users, ChevronRight, Compass } from 'lucide-react';
import type { ConversationDoc } from '@placetogo/shared';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getFirebase } from '@/lib/firebase';
import { formatActivityDateTime } from '@/lib/activities/format';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

function formatRelativeTime(ms?: number): string {
  if (!ms) return '';
  const diffMinutes = Math.floor((Date.now() - ms) / 60000);
  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes}m lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}j lalu`;
  return formatActivityDateTime(ms);
}

export function ConversationList() {
  const { account } = useAuth();
  const currentUid = account.kind === 'ready' ? account.account.uid : null;

  const [conversations, setConversations] = React.useState<ConversationDoc[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!currentUid) return;

    const { db } = getFirebase();
    const q = query(
      collection(db, 'conversations'),
      where('memberIds', 'array-contains', currentUid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ConversationDoc[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type ?? 'activity',
            activityId: data.activityId,
            title: data.title ?? 'Diskusi Ajakan',
            memberIds: data.memberIds ?? [],
            lastMessageAt: data.lastMessageAt ? toMillis(data.lastMessageAt) : undefined,
            lastMessageText: data.lastMessageText,
            lastSenderId: data.lastSenderId,
            createdAt: toMillis(data.createdAt),
            updatedAt: data.updatedAt ? toMillis(data.updatedAt) : undefined,
          };
        });

        // Urutkan percakapan dengan pesan terbaru di atas
        list.sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt));
        setConversations(list);
        setLoading(false);
      },
      (_err) => {
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUid]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground">Percakapan & Diskusi</h1>
        <p className="text-sm text-muted-foreground">
          Obrolan dengan sesama peserta aktivitas yang kamu ikuti.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-4 bg-background">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-8 text-center bg-mint/50">
          <div className="rounded-full bg-mint p-4 text-primary mb-3">
            <MessageSquare className="size-8" />
          </div>
          <h2 className="text-base font-bold text-foreground">Belum Ada Percakapan</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            Kamu belum bergabung ke aktivitas apa pun. Jelajahi ajakan menarik dan bergabunglah untuk mulai mengobrol!
          </p>
          <Link href="/jelajah">
            <Button size="md">
              <Compass className="size-4" />
              Jelajah Aktivitas
            </Button>
          </Link>
        </Card>
      )}

      {!loading && conversations.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-background p-3.5 hover:bg-mint/40 transition-colors shadow-sm"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
                <Users className="size-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-foreground text-base">{conv.title}</p>
                  {conv.lastMessageAt && (
                    <span className="text-[11px] shrink-0 text-muted-foreground">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="truncate text-xs text-muted-foreground">
                    {conv.lastMessageText || 'Belum ada pesan baru. Ketuk untuk mengobrol…'}
                  </p>
                  <span className="text-[11px] shrink-0 text-primary font-medium">
                    {conv.memberIds.length} peserta
                  </span>
                </div>
              </div>

              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
