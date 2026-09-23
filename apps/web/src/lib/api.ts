import {
  accountStateSchema,
  activityDocSchema,
  appreciationDocSchema,
  checkinResultSchema,
  conversationSchema,
  messageSchema,
  myProfileSchema,
  type AccountState,
  type ActivityDoc,
  type AppreciationDoc,
  type CheckinInput,
  type CheckinResult,
  type ConversationDoc,
  type CreateActivityInput,
  type Message,
  type MyProfile,
  type ProfileInput,
  type SendAppreciationInput,
  type SendMessageInput,
  type UpdateActivityCapacityInput,
  walletSummarySchema,
  paymentDocSchema,
  notificationListResponseSchema,
  reportDocSchema,
  type WalletSummary,
  type CreateTopupInput,
  type CreateWithdrawalInput,
  type PaymentDoc,
  type NotificationListResponse,
  type CreateReportInput,
  type ReportDoc,
  type ModerateReportInput,
  type ReportStatus,
  profileStatsSchema,
  type ProfileStats,
} from '@placetogo/shared';
import { getFirebase } from './firebase';
import { getPublicEnv } from './env';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`API ${status} ${code}`);
  }
}

/**
 * Memanggil backend dengan ID token Firebase terbaru sebagai Bearer.
 * Token tidak disimpan di storage kita; SDK yang mengelola dan memperbaruinya otomatis.
 * Diekspor agar dipakai ulang modul lain (mis. lib/maps/client.ts) — pola auth yang sama.
 */
export async function apiFetch(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<unknown> {
  const user = getFirebase().auth.currentUser;
  if (!user) throw new ApiError(401, 'no_user');
  const token = await user.getIdToken();
  const res = await fetch(`${getPublicEnv().NEXT_PUBLIC_API_BASE_URL}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const responseBody = (await res.json().catch(() => ({}))) as { error?: string; message?: string; fields?: Record<string, string> };
    const err = new ApiError(res.status, responseBody.error ?? 'unknown');
    (err as ApiError & { fields?: Record<string, string>; message: string }).fields = responseBody.fields;
    if (responseBody.message) {
      err.message = responseBody.message;
    }
    throw err;
  }
  return res.json();
}

/** Kondisi akun; membuat user_private awal (idempoten) bila belum ada. */
export async function loadAccount(): Promise<AccountState> {
  let state = accountStateSchema.parse(await apiFetch('/v1/me', 'GET'));
  if (!state.initialized) state = accountStateSchema.parse(await apiFetch('/v1/me/init', 'POST'));
  return state;
}

/** null bila profil belum pernah disimpan. */
export async function getMyProfile(): Promise<MyProfile | null> {
  try {
    return myProfileSchema.parse(await apiFetch('/v1/me/profile', 'GET'));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function saveMyProfile(input: ProfileInput): Promise<MyProfile> {
  return myProfileSchema.parse(await apiFetch('/v1/me/profile', 'PUT', input));
}

// --- Aktivitas & Partisipasi (Fase 06) ---

export async function createActivity(input: CreateActivityInput): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch('/v1/activities', 'POST', input));
}

export async function publishActivity(id: string): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch(`/v1/activities/${id}/publish`, 'POST'));
}

export async function cancelActivity(id: string): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch(`/v1/activities/${id}/cancel`, 'POST'));
}

export async function startActivity(id: string): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch(`/v1/activities/${id}/start`, 'POST'));
}

export async function completeActivity(id: string): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch(`/v1/activities/${id}/complete`, 'POST'));
}

export async function updateActivityCapacity(id: string, input: UpdateActivityCapacityInput): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch(`/v1/activities/${id}/capacity`, 'PATCH', input));
}

export async function joinActivity(id: string): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch(`/v1/activities/${id}/join-requests`, 'POST'));
}

export async function leaveActivity(id: string): Promise<ActivityDoc> {
  return activityDocSchema.parse(await apiFetch(`/v1/activities/${id}/join-requests/me`, 'DELETE'));
}

// --- Chat & Diskusi (Fase 07) ---

export async function listMyConversations(): Promise<ConversationDoc[]> {
  const data = (await apiFetch('/v1/conversations', 'GET')) as unknown[];
  return data.map((d) => conversationSchema.parse(d));
}

export async function getConversation(id: string): Promise<ConversationDoc> {
  return conversationSchema.parse(await apiFetch(`/v1/conversations/${id}`, 'GET'));
}

export async function getActivityConversation(activityId: string): Promise<ConversationDoc> {
  return conversationSchema.parse(await apiFetch(`/v1/conversations/activity/${activityId}`, 'GET'));
}

export async function sendMessage(conversationId: string, input: SendMessageInput): Promise<Message> {
  return messageSchema.parse(await apiFetch(`/v1/conversations/${conversationId}/messages`, 'POST', input));
}

// --- Meeting Confirmation & Apresiasi (Fase 08) ---

export async function checkinActivity(id: string, input?: CheckinInput): Promise<CheckinResult> {
  return checkinResultSchema.parse(await apiFetch(`/v1/activities/${id}/checkin`, 'POST', input));
}

export async function getCheckinStatus(id: string): Promise<CheckinResult | null> {
  const data = await apiFetch(`/v1/activities/${id}/checkin`, 'GET');
  if (!data) return null;
  return checkinResultSchema.parse(data);
}

export async function sendAppreciation(input: SendAppreciationInput): Promise<AppreciationDoc> {
  return appreciationDocSchema.parse(await apiFetch('/v1/appreciations', 'POST', input));
}

export async function listAppreciationsForActivity(activityId: string): Promise<AppreciationDoc[]> {
  const data = (await apiFetch(`/v1/appreciations/activity/${activityId}`, 'GET')) as unknown[];
  return data.map((d) => appreciationDocSchema.parse(d));
}

// --- Coin Economy & Pembayaran DOKU (Fase 09) ---

export async function getWallet(): Promise<WalletSummary> {
  return walletSummarySchema.parse(await apiFetch('/v1/wallet', 'GET'));
}

export async function createTopup(input: CreateTopupInput): Promise<PaymentDoc> {
  return paymentDocSchema.parse(await apiFetch('/v1/wallet/topup', 'POST', input));
}

export async function createWithdrawal(input: CreateWithdrawalInput): Promise<WalletSummary> {
  return walletSummarySchema.parse(await apiFetch('/v1/wallet/withdraw', 'POST', input));
}

export async function getPayment(orderId: string): Promise<PaymentDoc> {
  return paymentDocSchema.parse(await apiFetch(`/v1/payments/${orderId}`, 'GET'));
}

export async function simulatePaymentSuccess(orderId: string): Promise<PaymentDoc> {
  return paymentDocSchema.parse(await apiFetch(`/v1/payments/${orderId}/simulate-success`, 'POST'));
}

// --- Notifikasi & Pelaporan Moderasi (Fase 10) ---

export async function getNotifications(): Promise<NotificationListResponse> {
  return notificationListResponseSchema.parse(await apiFetch('/v1/notifications', 'GET'));
}

export async function markNotificationAsRead(id: string): Promise<{ ok: boolean }> {
  return (await apiFetch(`/v1/notifications/${id}/read`, 'PATCH')) as { ok: boolean };
}

export async function markAllNotificationsAsRead(): Promise<{ ok: boolean; updatedCount: number }> {
  return (await apiFetch('/v1/notifications/read-all', 'POST')) as { ok: boolean; updatedCount: number };
}

export async function createReport(input: CreateReportInput): Promise<ReportDoc> {
  return reportDocSchema.parse(await apiFetch('/v1/reports', 'POST', input));
}

export async function listAdminReports(status?: ReportStatus): Promise<ReportDoc[]> {
  const query = status ? `?status=${status}` : '';
  const data = (await apiFetch(`/v1/admin/reports${query}`, 'GET')) as unknown[];
  return data.map((d) => reportDocSchema.parse(d));
}

export async function moderateReport(id: string, input: ModerateReportInput): Promise<ReportDoc> {
  return reportDocSchema.parse(await apiFetch(`/v1/admin/reports/${id}`, 'PATCH', input));
}




// --- Profil: statistik, ajakan saya, dan hadiah ---

/** Angka ringkas untuk halaman profil, dihitung backend dari data sungguhan. */
export async function getProfileStats(): Promise<ProfileStats> {
  return profileStatsSchema.parse(await apiFetch('/v1/me/stats', 'GET'));
}

/** Ajakan yang dibuat pengguna yang sedang masuk, termasuk draft dan yang sudah lewat. */
export async function getMyActivities(): Promise<ActivityDoc[]> {
  const res = (await apiFetch('/v1/me/activities', 'GET')) as { items: unknown[] };
  return res.items.map((item) => activityDocSchema.parse(item));
}

/** Hadiah yang diterima pengguna, beserta total koinnya. */
export async function getReceivedGifts(): Promise<{ items: AppreciationDoc[]; totalCoins: number }> {
  const res = (await apiFetch('/v1/appreciations/received', 'GET')) as {
    items: unknown[];
    totalCoins: number;
  };
  return {
    items: res.items.map((item) => appreciationDocSchema.parse(item)),
    totalCoins: res.totalCoins,
  };
}
