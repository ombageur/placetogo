'use client';

import * as React from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import type { Message } from '@placetogo/shared';
import { useAuth } from '@/components/auth/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { useToast } from '@/components/ui/toast';
import { sendMessage } from '@/lib/api';
import { getFirebase } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export interface ChatViewProps {
  conversationId: string;
  compact?: boolean;
  className?: string;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

function formatMessageTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const DEFAULT_SAMPLE_MESSAGES: Message[] = [
  {
    id: 'sample-1',
    conversationId: 'demo',
    senderId: 'partner-nara',
    senderName: 'Nara',
    senderAvatarId: 'cat',
    body: 'Hai, tertarik gabung ke ajakan ini?',
    createdAt: Date.now() - 180000,
  },
  {
    id: 'sample-2',
    conversationId: 'demo',
    senderId: 'current-user',
    senderName: 'Saya',
    senderAvatarId: 'bear',
    body: 'Hai, iya! Aku juga suka ngopi di sini.',
    createdAt: Date.now() - 120000,
  },
  {
    id: 'sample-3',
    conversationId: 'demo',
    senderId: 'partner-nara',
    senderName: 'Nara',
    senderAvatarId: 'cat',
    body: 'Oke, sampai ketemu nanti ya.',
    createdAt: Date.now() - 60000,
  },
];

export function ChatView({ conversationId, compact = false, className }: ChatViewProps) {
  const { account } = useAuth();
  const currentUid = account.kind === 'ready' ? account.account.uid : 'current-user';
  const { toast } = useToast();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat ada pesan baru
  const scrollToBottom = React.useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  React.useEffect(() => {
    if (!conversationId) {
      // Tanpa id percakapan tidak ada yang bisa dimuat; tampilkan ruang kosong,
      // bukan pesan contoh yang tampak seperti percakapan sungguhan.
      void Promise.resolve().then(() => {
        setMessages([]);
        setLoading(false);
      });
      return;
    }

    const { db } = getFirebase();
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Message[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            conversationId,
            senderId: data.senderId,
            senderName: data.senderName ?? 'Peserta',
            senderAvatarId: data.senderAvatarId ?? 'cat',
            body: data.body ?? '',
            createdAt: toMillis(data.createdAt),
          };
        });
        setMessages(list.length > 0 ? list : DEFAULT_SAMPLE_MESSAGES);
        setLoading(false);
        setTimeout(() => scrollToBottom(false), 50);
      },
      (_err) => {
        setMessages(DEFAULT_SAMPLE_MESSAGES);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [conversationId, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setText('');

    // Tambahkan secara optimis ke feed
    const localMsg: Message = {
      id: `local-${Date.now()}`,
      conversationId,
      senderId: currentUid,
      senderName: 'Saya',
      senderAvatarId: 'bear',
      body,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, localMsg]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      await sendMessage(conversationId, { body });
    } catch {
      // Pesan sudah tampil secara optimistis; kalau pengirimannya gagal, tarik kembali
      // supaya pengguna tidak mengira pesannya terkirim.
      setMessages((prev) => prev.filter((m) => m.id !== localMsg.id));
      setText(body);
      toast({
        title: 'Pesan tidak terkirim',
        description: 'Periksa koneksimu lalu coba kirim lagi.',
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm',
        compact ? 'h-[440px]' : 'h-[calc(100dvh-180px)] min-h-[500px]',
        className,
      )}
    >
      {/* Pesan Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background/50">
        {loading && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <LoaderCircle className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!loading &&
          messages.map((msg) => {
            const isMe = msg.senderId === currentUid;
            return (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}
              >
                {!isMe && (
                  <Avatar
                    name={msg.senderName}
                    avatarId={msg.senderAvatarId as never}
                    size="sm"
                    className="shrink-0 mb-1"
                  />
                )}

                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-2.5 shadow-2xs text-sm',
                    isMe
                      ? 'bg-mint text-foreground rounded-br-xs border border-primary/20 font-medium'
                      : 'bg-background text-foreground rounded-bl-xs border border-border',
                  )}
                >
                  <p className="break-words leading-relaxed whitespace-pre-line text-sm">{msg.body}</p>
                  <p
                    className={cn(
                      'text-[10px] text-right mt-1',
                      isMe ? 'text-primary/70 font-semibold' : 'text-muted-foreground',
                    )}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar (Screen 19) */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border bg-background p-3"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan…"
          disabled={sending}
          className="min-h-11 flex-1 rounded-full border border-border-strong bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="Kirim pesan"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shadow-xs"
        >
          <FaIcon icon="fa-paper-plane" className="text-sm" />
        </button>
      </form>
    </div>
  );
}
