import type { Metadata } from 'next';
import { ConversationList } from '@/components/chat/conversation-list';

export const metadata: Metadata = { title: 'Chat & Diskusi' };

export default function ChatPage() {
  return <ConversationList />;
}

