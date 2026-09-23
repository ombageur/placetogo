/** Nama koleksi Firestore. Satu-satunya sumber kebenaran untuk web, API, dan tes. */
export const COLLECTIONS = {
  users: 'users',
  userPrivate: 'user_private',
  activities: 'activities',
  participants: 'participants',
  joinRequests: 'join_requests',
  conversations: 'conversations',
  messages: 'messages',
  wallets: 'wallets',
  walletLedger: 'wallet_ledger',
  payments: 'payments',
  webhookEvents: 'webhook_events',
  appreciations: 'appreciations',
  reports: 'reports',
  notifications: 'notifications',
  checkins: 'checkins',
} as const;


export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Pagination berbasis cursor: ukuran awal 10, maksimum 20. */
export const PAGINATION = { defaultSize: 10, maxSize: 20 } as const;
