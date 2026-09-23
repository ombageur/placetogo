/**
 * Kontrak pembayaran DOKU (Fase 00: hanya antarmuka, TANPA panggilan jaringan).
 *
 * Endpoint, format signature, dan daftar status HARUS diambil dari dokumentasi
 * resmi DOKU terkini pada Fase 09; tidak ada yang diasumsikan di sini.
 * Sandbox wajib lebih dulu. Mode production ditolak oleh validasi env.
 */
export type PaymentState = 'created' | 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

export interface CreateCheckoutInput {
  orderId: string; // unik, dibuat backend
  uid: string;
  amountIdr: number; // integer rupiah; divalidasi ulang saat notifikasi
}

export interface CheckoutSession {
  orderId: string;
  redirectUrl: string;
}

export interface PaymentGateway {
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  /** Verifikasi signature notifikasi menurut spesifikasi resmi DOKU. */
  verifyNotification(rawBody: string, headers: Record<string, string | undefined>): boolean;
}

export const notConfiguredPaymentGateway: PaymentGateway = {
  async createCheckout() {
    throw new Error('DOKU belum diaktifkan (Fase 09).');
  },
  verifyNotification() {
    return false; // gagal tertutup
  },
};
