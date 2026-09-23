'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Info } from 'lucide-react';
import type { ConversationDoc } from '@placetogo/shared';
import { ChatView } from '@/components/chat/chat-view';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Avatar } from '@/components/ui/avatar';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { getConversation } from '@/lib/api';
import { SupportModal } from '@/components/meeting/support-modal';

/*
 * Waktu untuk percakapan contoh diambil sekali saat modul dimuat. Memanggil Date.now()
 * saat render membuat keluaran render bergantung pada waktu, sehingga hasilnya berbeda
 * pada tiap render untuk masukan yang sama.
 */
const SAMPLE_TIMESTAMPS = { created: Date.now(), lastMessage: Date.now() - 60_000 };

export default function ChatDetailPage() {
  const { id } = useParams() as { id: string };
  const [conversation, setConversation] = React.useState<ConversationDoc | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    getConversation(id)
      .then((data) => {
        if (!ignore) {
          setConversation(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  /*
   * Kegagalan memuat percakapan sebelumnya jatuh ke percakapan contoh di bawah, sehingga
   * layarnya menampilkan pesan karangan seolah-olah nyata. Sekarang galatnya ditampilkan
   * apa adanya; contoh hanya dipakai bila percakapannya memang belum ada, bukan saat gagal.
   */
  if (error) {
    return (
      <ErrorState
        title="Tidak dapat memuat percakapan"
        description="Periksa koneksi internet kamu lalu coba lagi."
        onRetry={() => {
          setError(false);
          setLoading(true);
          getConversation(id)
            .then((data) => {
              setConversation(data);
              setLoading(false);
            })
            .catch(() => {
              setError(true);
              setLoading(false);
            });
        }}
      />
    );
  }

  // Contoh percakapan untuk pratinjau Screen 19 ketika percakapan hidup belum ada.
  const activeConversation: ConversationDoc = conversation ?? {
    id,
    type: 'direct',
    activityId: id !== 'demo' ? id : 'act-1',
    memberIds: ['current-user', 'partner-nara'],
    title: 'Nara',
    createdAt: SAMPLE_TIMESTAMPS.created,
    updatedAt: SAMPLE_TIMESTAMPS.created,
    lastMessageText: 'Oke, sampai ketemu nanti ya.',
    lastMessageAt: SAMPLE_TIMESTAMPS.lastMessage,
  };

  const activityId = activeConversation.activityId || id;

  return (
    <div className="flex flex-col gap-3 -mx-4 -mt-4 sm:mx-0 sm:mt-0">
      {/* Screen 19 Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/chat"
            aria-label="Kembali ke daftar chat"
            className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </Link>

          <div className="relative">
            <Avatar name={activeConversation.title} avatarId="cat" size="md" />
            <span
              aria-label="Online"
              className="absolute bottom-0 right-0 size-3 rounded-full bg-primary ring-2 ring-background"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base text-foreground leading-tight">
              {activeConversation.title}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <span className="size-1.5 rounded-full bg-primary" />
              Online
            </p>
          </div>
        </div>

        {/* Action icons (Screen 19) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/pertemuan/${activityId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-primary hover:bg-mint/80 transition-colors"
            title="Pertemuan"
          >
            <FaIcon icon="fa-handshake" className="text-xs" />
            <span>Pertemuan</span>
          </Link>
          <button
            type="button"
            onClick={() => setSupportModalOpen(true)}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-mint hover:text-primary transition-colors cursor-pointer"
            title="Beri Hadiah & Dukungan"
          >
            <FaIcon icon="fa-gift" className="text-sm text-primary" />
          </button>
          {activityId && (
            <Link
              href={`/jelajah/${activityId}`}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Detail Ajakan"
            >
              <Info className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className="px-4 sm:px-0">
        <ChatView conversationId={activeConversation.id} />
      </div>

      {/* Support Modal (21 Icon Hadiah Dukungan Resmi) */}
      <SupportModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        targetUser={{
          uid: activeConversation.memberIds?.find((m) => m !== 'current-user') || 'partner-nara',
          displayName: activeConversation.title,
          avatarId: 'cat',
        }}
      />
    </div>
  );
}
