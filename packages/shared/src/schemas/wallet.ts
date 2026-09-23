import { z } from 'zod';

/** Daftar paket top-up resmi placetogo */
export const TOPUP_PACKAGES = [
  {
    id: 'pkg_10k',
    label: '10.000 Coin',
    baseCoins: 10000,
    bonusCoins: 0,
    totalCoins: 10000,
    priceIdr: 10000,
    tag: undefined,
  },
  {
    id: 'pkg_25k',
    label: '25.000 Coin',
    baseCoins: 25000,
    bonusCoins: 1000,
    totalCoins: 26000,
    priceIdr: 25000,
    tag: '+1.000 Bonus',
  },
  {
    id: 'pkg_50k',
    label: '50.000 Coin',
    baseCoins: 50000,
    bonusCoins: 3000,
    totalCoins: 53000,
    priceIdr: 50000,
    tag: 'Populer · +3.000 Bonus',
  },
  {
    id: 'pkg_100k',
    label: '100.000 Coin',
    baseCoins: 100000,
    bonusCoins: 10000,
    totalCoins: 110000,
    priceIdr: 100000,
    tag: '+10.000 Bonus',
  },
  {
    id: 'pkg_250k',
    label: '250.000 Coin',
    baseCoins: 250000,
    bonusCoins: 30000,
    totalCoins: 280000,
    priceIdr: 250000,
    tag: 'Terbaik · +30.000 Bonus',
  },
] as const;

export type TopupPackageId = (typeof TOPUP_PACKAGES)[number]['id'];

export const PAYMENT_METHODS = [
  'qris',
  'bca_va',
  'mandiri_va',
  'bri_va',
  'doku_checkout',
] as const;

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qris: 'QRIS (Semua E-Wallet / Bank)',
  bca_va: 'BCA Virtual Account',
  mandiri_va: 'Mandiri Virtual Account',
  bri_va: 'BRI Virtual Account',
  doku_checkout: 'DOKU Checkout (Kartu & Lainnya)',
};

/** Skema metode penarikan dana (Payout) */
export const WITHDRAWAL_METHODS = [
  'bca',
  'mandiri',
  'bri',
  'bni',
  'gopay',
  'ovo',
  'dana',
  'shopeepay',
] as const;
export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number];
export const withdrawalMethodSchema = z.enum(WITHDRAWAL_METHODS);

export const WITHDRAWAL_METHOD_LABELS: Record<WithdrawalMethod, string> = {
  bca: 'Bank BCA',
  mandiri: 'Bank Mandiri',
  bri: 'Bank BRI',
  bni: 'Bank BNI',
  gopay: 'GoPay',
  ovo: 'OVO',
  dana: 'DANA',
  shopeepay: 'ShopeePay',
};

/** Skema dokumen wallets/{uid} */
export const walletDocSchema = z.object({
  balance: z.number().int().min(0), // Coin Saya (non-withdrawable)
  earningsIdr: z.number().int().min(0).default(0), // Penghasilan Saya (withdrawable, dalam Rupiah)
  version: z.number().int().min(0),
  updatedAt: z.number().int().positive().optional(),
});
export type WalletDoc = z.infer<typeof walletDocSchema>;

/** Skema jenis transaksi ledger koin & penghasilan */
export const LEDGER_TRANSACTION_TYPES = [
  'topup',
  'reward_checkin',
  'appreciation_send',
  'appreciation_receive',
  'activity_create',
  'payout_withdraw',
  'gift_payout_receive',
  'admin_adjustment',
] as const;
export type LedgerTransactionType = (typeof LEDGER_TRANSACTION_TYPES)[number];

/** Skema catatan immutable di wallet_ledger/{id} */
export const walletLedgerEntrySchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  delta: z.number().int(), // positif kredit, negatif debit
  currency: z.enum(['coin', 'idr']).default('coin'),
  type: z.enum(LEDGER_TRANSACTION_TYPES),
  referenceId: z.string().min(1),
  note: z.string().optional(),
  createdAt: z.number().int().positive(),
});
export type WalletLedgerEntry = z.infer<typeof walletLedgerEntrySchema>;

/** Skema input inisiasi top-up Coin */
export const createTopupInputSchema = z.object({
  packageId: z.string().min(1),
  paymentMethod: paymentMethodSchema.default('qris'),
});
export type CreateTopupInput = z.infer<typeof createTopupInputSchema>;

/** Skema input penarikan penghasilan (Tarik Dana ke Bank / E-Wallet) */
export const createWithdrawalInputSchema = z.object({
  amountIdr: z.number().int().min(20000, 'Minimal penarikan Rp20.000'),
  method: withdrawalMethodSchema,
  accountNumber: z.string().trim().min(4, 'Nomor rekening atau nomor HP tidak valid'),
  accountName: z.string().trim().min(3, 'Nama pemilik rekening wajib diisi'),
});
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalInputSchema>;

/** Status pembayaran / transaksi */
export const PAYMENT_STATES = ['pending', 'paid', 'failed', 'expired'] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];
export const paymentStateSchema = z.enum(PAYMENT_STATES);

/** Skema dokumen payments/{orderId} */
export const paymentDocSchema = z.object({
  orderId: z.string().min(1),
  uid: z.string().min(1),
  packageId: z.string().min(1),
  coinAmount: z.number().int().positive(),
  amountIdr: z.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  status: paymentStateSchema,
  paymentUrl: z.string().optional(),
  vaNumber: z.string().optional(),
  qrString: z.string().optional(),
  expiresAt: z.number().int().positive().optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  paidAt: z.number().int().positive().optional(),
});
export type PaymentDoc = z.infer<typeof paymentDocSchema>;

/** Skema respons dompet pengguna */
export const walletSummarySchema = z.object({
  balance: z.number().int().min(0), // Coin Saya
  earningsIdr: z.number().int().min(0).default(0), // Penghasilan Saya (Rupiah)
  ledger: z.array(walletLedgerEntrySchema),
});
export type WalletSummary = z.infer<typeof walletSummarySchema>;

