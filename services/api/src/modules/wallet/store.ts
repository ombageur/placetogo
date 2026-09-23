import type { Firestore } from 'firebase-admin/firestore';
import {
  COLLECTIONS,
  TOPUP_PACKAGES,
  type CreateTopupInput,
  type LedgerTransactionType,
  type PaymentDoc,
  type WalletDoc,
  type WalletLedgerEntry,
  type WalletSummary,
} from '@placetogo/shared';
import type { PaymentGateway } from '../doku/contract.js';
import { withoutUndefined } from '../../lib/firestore-data.js';

export interface WalletStore {
  getSummary(uid: string): Promise<WalletSummary>;
  credit(
    uid: string,
    amount: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc>;
  creditEarnings(
    uid: string,
    amountIdr: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc>;
  debit(
    uid: string,
    amount: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc>;
  debitEarnings(
    uid: string,
    amountIdr: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc>;
  createTopup(uid: string, input: CreateTopupInput): Promise<PaymentDoc>;
  processPaymentSuccess(orderId: string, payload?: unknown): Promise<PaymentDoc>;
  getPayment(orderId: string, uid?: string): Promise<PaymentDoc | null>;
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super('Saldo Coin tidak mencukupi untuk melakukan transaksi ini.');
  }
}

export class PaymentNotFoundError extends Error {
  constructor() {
    super('Transaksi pembayaran tidak ditemukan.');
  }
}

export class FirestoreWalletStore implements WalletStore {
  constructor(
    private readonly db: Firestore,
    private readonly doku: PaymentGateway,
  ) {}

  async getSummary(uid: string): Promise<WalletSummary> {
    const walletRef = this.db.collection(COLLECTIONS.wallets).doc(uid);
    const ledgerRef = this.db
      .collection(COLLECTIONS.walletLedger)
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(20);

    const [walletSnap, ledgerSnap] = await Promise.all([walletRef.get(), ledgerRef.get()]);

    const balance = walletSnap.exists ? (walletSnap.data()?.balance ?? 0) : 0;
    let earningsIdr = walletSnap.exists ? (walletSnap.data()?.earningsIdr ?? 0) : 0;

    if (earningsIdr === 0) {
      const appreciationsSnap = await this.db
        .collection(COLLECTIONS.appreciations)
        .where('toUid', '==', uid)
        .get();
      const totalGifts = appreciationsSnap.docs.reduce((acc, doc) => acc + (doc.data()?.amount || 0), 0);
      const totalWithdrawn = ledgerSnap.docs
        .filter((doc) => doc.data()?.type === 'payout_withdraw')
        .reduce((acc, doc) => acc + Math.abs(doc.data()?.delta || 0), 0);
      earningsIdr = Math.max(0, totalGifts - totalWithdrawn);
    }

    const ledger: WalletLedgerEntry[] = ledgerSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        uid: d.uid,
        delta: d.delta,
        currency: d.currency ?? 'coin',
        type: d.type,
        referenceId: d.referenceId,
        note: d.note,
        createdAt: d.createdAt,
      };
    });

    return { balance, earningsIdr, ledger };
  }

  async credit(
    uid: string,
    amount: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const walletRef = this.db.collection(COLLECTIONS.wallets).doc(uid);
    const ledgerRef = this.db.collection(COLLECTIONS.walletLedger).doc();
    const now = Date.now();

    return this.db.runTransaction(async (t) => {
      const snap = await t.get(walletRef);
      const currentBalance = snap.exists ? (snap.data()?.balance ?? 0) : 0;
      const currentVersion = snap.exists ? (snap.data()?.version ?? 0) : 0;

      const newBalance = currentBalance + amount;
      const newVersion = currentVersion + 1;

      const walletData: WalletDoc = {
        balance: newBalance,
        earningsIdr: snap.exists ? (snap.data()?.earningsIdr ?? 0) : 0,
        version: newVersion,
        updatedAt: now,
      };

      t.set(walletRef, walletData, { merge: true });
      t.set(
        ledgerRef,
        withoutUndefined({
          id: ledgerRef.id,
          uid,
          delta: amount,
          currency: 'coin',
          type,
          referenceId,
          note: note || undefined,
          createdAt: now,
        }),
      );

      return walletData;
    });
  }

  async creditEarnings(
    uid: string,
    amountIdr: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const walletRef = this.db.collection(COLLECTIONS.wallets).doc(uid);
    const ledgerRef = this.db.collection(COLLECTIONS.walletLedger).doc();
    const now = Date.now();

    return this.db.runTransaction(async (t) => {
      const snap = await t.get(walletRef);
      const currentBalance = snap.exists ? (snap.data()?.balance ?? 0) : 0;
      const currentEarnings = snap.exists ? (snap.data()?.earningsIdr ?? 0) : 0;
      const currentVersion = snap.exists ? (snap.data()?.version ?? 0) : 0;

      const newEarnings = currentEarnings + amountIdr;
      const newVersion = currentVersion + 1;

      const walletData: WalletDoc = {
        balance: currentBalance,
        earningsIdr: newEarnings,
        version: newVersion,
        updatedAt: now,
      };

      t.set(walletRef, walletData, { merge: true });
      t.set(
        ledgerRef,
        withoutUndefined({
          id: ledgerRef.id,
          uid,
          delta: amountIdr,
          currency: 'idr',
          type,
          referenceId,
          note: note || undefined,
          createdAt: now,
        }),
      );

      return walletData;
    });
  }

  async debit(
    uid: string,
    amount: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const walletRef = this.db.collection(COLLECTIONS.wallets).doc(uid);
    const ledgerRef = this.db.collection(COLLECTIONS.walletLedger).doc();
    const now = Date.now();

    return this.db.runTransaction(async (t) => {
      const snap = await t.get(walletRef);
      const currentBalance = snap.exists ? (snap.data()?.balance ?? 0) : 0;
      const currentVersion = snap.exists ? (snap.data()?.version ?? 0) : 0;

      if (currentBalance < amount) {
        throw new InsufficientBalanceError();
      }

      const newBalance = currentBalance - amount;
      const newVersion = currentVersion + 1;

      const walletData: WalletDoc = {
        balance: newBalance,
        earningsIdr: snap.exists ? (snap.data()?.earningsIdr ?? 0) : 0,
        version: newVersion,
        updatedAt: now,
      };

      t.set(walletRef, walletData, { merge: true });
      t.set(
        ledgerRef,
        withoutUndefined({
          id: ledgerRef.id,
          uid,
          delta: -amount,
          type,
          referenceId,
          note: note || undefined,
          createdAt: now,
        }),
      );

      return walletData;
    });
  }

  async debitEarnings(
    uid: string,
    amountIdr: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const walletRef = this.db.collection(COLLECTIONS.wallets).doc(uid);
    const ledgerRef = this.db.collection(COLLECTIONS.walletLedger).doc();
    const now = Date.now();

    return this.db.runTransaction(async (t) => {
      const snap = await t.get(walletRef);
      const currentBalance = snap.exists ? (snap.data()?.balance ?? 0) : 0;
      const currentEarnings = snap.exists ? (snap.data()?.earningsIdr ?? 0) : 0;
      const currentVersion = snap.exists ? (snap.data()?.version ?? 0) : 0;

      if (currentEarnings < amountIdr) {
        throw new InsufficientBalanceError();
      }

      const newEarnings = currentEarnings - amountIdr;
      const newVersion = currentVersion + 1;

      const walletData: WalletDoc = {
        balance: currentBalance,
        earningsIdr: newEarnings,
        version: newVersion,
        updatedAt: now,
      };

      t.set(walletRef, walletData, { merge: true });
      t.set(
        ledgerRef,
        withoutUndefined({
          id: ledgerRef.id,
          uid,
          delta: -amountIdr,
          currency: 'idr',
          type,
          referenceId,
          note: note || undefined,
          createdAt: now,
        }),
      );

      return walletData;
    });
  }

  async createTopup(uid: string, input: CreateTopupInput): Promise<PaymentDoc> {
    const pkg = TOPUP_PACKAGES.find((p) => p.id === input.packageId);
    if (!pkg) {
      throw new Error('Paket top-up tidak ditemukan.');
    }

    const orderId = `TOPUP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 1 jam

    const session = await this.doku.createCheckout({
      orderId,
      uid,
      amountIdr: pkg.priceIdr,
    });

    // Nomor virtual account atau QR simulasi untuk sandbox demo
    let vaNumber: string | undefined;
    let qrString: string | undefined;

    if (input.paymentMethod === 'bca_va') {
      vaNumber = `80777${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else if (input.paymentMethod === 'mandiri_va') {
      vaNumber = `88708${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else if (input.paymentMethod === 'bri_va') {
      vaNumber = `12800${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else if (input.paymentMethod === 'qris') {
      qrString = `00020101021226580016ID.CO.DOKU.WWW011893600998${orderId}520458125303360540${pkg.priceIdr}5802ID5913PLACETOGO_ID6007JAKARTA6304`;
    }

    const paymentDoc: PaymentDoc = {
      orderId,
      uid,
      packageId: pkg.id,
      coinAmount: pkg.totalCoins,
      amountIdr: pkg.priceIdr,
      paymentMethod: input.paymentMethod,
      status: 'pending',
      paymentUrl: session.redirectUrl,
      vaNumber,
      qrString,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    // vaNumber dan qrString saling eksklusif menurut metode pembayaran, jadi salah satunya
    // selalu undefined dan harus dibuang sebelum ditulis (lihat lib/firestore-data.ts).
    await this.db.collection(COLLECTIONS.payments).doc(orderId).set(withoutUndefined(paymentDoc));
    return paymentDoc;
  }

  async processPaymentSuccess(orderId: string, payload?: unknown): Promise<PaymentDoc> {
    const paymentRef = this.db.collection(COLLECTIONS.payments).doc(orderId);
    const webhookRef = this.db.collection(COLLECTIONS.webhookEvents).doc(`doku_${orderId}`);
    const now = Date.now();

    return this.db.runTransaction(async (t) => {
      const paymentSnap = await t.get(paymentRef);
      if (!paymentSnap.exists) {
        throw new PaymentNotFoundError();
      }

      const payment = paymentSnap.data() as PaymentDoc;

      // Idempotensi: jika sudah dibayar, return data langsung
      if (payment.status === 'paid') {
        return payment;
      }

      const updatedPayment: PaymentDoc = {
        ...payment,
        status: 'paid',
        paidAt: now,
        updatedAt: now,
      };

      t.update(paymentRef, {
        status: 'paid',
        paidAt: now,
        updatedAt: now,
      });

      t.set(webhookRef, {
        id: `doku_${orderId}`,
        source: 'doku',
        orderId,
        payload: payload || null,
        processedAt: now,
      });

      // Kreditkan koin ke dompet pengguna
      const walletRef = this.db.collection(COLLECTIONS.wallets).doc(payment.uid);
      const ledgerRef = this.db.collection(COLLECTIONS.walletLedger).doc();

      const walletSnap = await t.get(walletRef);
      const currentBalance = walletSnap.exists ? (walletSnap.data()?.balance ?? 0) : 0;
      const currentVersion = walletSnap.exists ? (walletSnap.data()?.version ?? 0) : 0;

      t.set(
        walletRef,
        {
          balance: currentBalance + payment.coinAmount,
          version: currentVersion + 1,
          updatedAt: now,
        },
        { merge: true },
      );

      t.set(ledgerRef, {
        id: ledgerRef.id,
        uid: payment.uid,
        delta: payment.coinAmount,
        type: 'topup',
        referenceId: orderId,
        note: `Top Up ${payment.coinAmount.toLocaleString('id-ID')} Coin`,
        createdAt: now,
      });

      return updatedPayment;
    });
  }

  async getPayment(orderId: string, uid?: string): Promise<PaymentDoc | null> {
    const snap = await this.db.collection(COLLECTIONS.payments).doc(orderId).get();
    if (!snap.exists) return null;
    const data = snap.data() as PaymentDoc;
    if (uid && data.uid !== uid) return null;
    return data;
  }
}

export class MemoryWalletStore implements WalletStore {
  private wallets = new Map<string, WalletDoc>();
  private ledger: WalletLedgerEntry[] = [];
  private payments = new Map<string, PaymentDoc>();

  constructor(private readonly doku: PaymentGateway) {}

  async getSummary(uid: string): Promise<WalletSummary> {
    const wallet = this.wallets.get(uid) || { balance: 0, earningsIdr: 0, version: 0 };
    const userLedger = this.ledger
      .filter((e) => e.uid === uid)
      .sort((a, b) => b.createdAt - a.createdAt);
    return { balance: wallet.balance, earningsIdr: wallet.earningsIdr ?? 0, ledger: userLedger };
  }

  async credit(
    uid: string,
    amount: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const wallet = this.wallets.get(uid) || { balance: 0, earningsIdr: 0, version: 0 };
    const newBalance = wallet.balance + amount;
    const newVersion = wallet.version + 1;
    const now = Date.now();

    const updated: WalletDoc = {
      balance: newBalance,
      earningsIdr: wallet.earningsIdr ?? 0,
      version: newVersion,
      updatedAt: now,
    };
    this.wallets.set(uid, updated);
    this.ledger.push({
      id: `led_${Math.random()}`,
      uid,
      currency: 'coin',
      delta: amount,
      type,
      referenceId,
      note,
      createdAt: now,
    });
    return updated;
  }

  async debit(
    uid: string,
    amount: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const wallet = this.wallets.get(uid) || { balance: 0, earningsIdr: 0, version: 0 };
    if (wallet.balance < amount) {
      throw new InsufficientBalanceError();
    }
    const newBalance = wallet.balance - amount;
    const newVersion = wallet.version + 1;
    const now = Date.now();

    const updated: WalletDoc = {
      balance: newBalance,
      earningsIdr: wallet.earningsIdr ?? 0,
      version: newVersion,
      updatedAt: now,
    };
    this.wallets.set(uid, updated);
    this.ledger.push({
      id: `led_${Math.random()}`,
      uid,
      currency: 'coin',
      delta: -amount,
      type,
      referenceId,
      note,
      createdAt: now,
    });
    return updated;
  }

  async creditEarnings(
    uid: string,
    amountIdr: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const wallet = this.wallets.get(uid) || { balance: 0, earningsIdr: 0, version: 0 };
    const newEarnings = (wallet.earningsIdr ?? 0) + amountIdr;
    const newVersion = wallet.version + 1;
    const now = Date.now();

    const updated: WalletDoc = {
      balance: wallet.balance,
      earningsIdr: newEarnings,
      version: newVersion,
      updatedAt: now,
    };
    this.wallets.set(uid, updated);
    this.ledger.push({
      id: `led_${Math.random()}`,
      uid,
      currency: 'idr',
      delta: amountIdr,
      type,
      referenceId,
      note,
      createdAt: now,
    });
    return updated;
  }

  async debitEarnings(
    uid: string,
    amountIdr: number,
    type: LedgerTransactionType,
    referenceId: string,
    note?: string,
  ): Promise<WalletDoc> {
    const wallet = this.wallets.get(uid) || { balance: 0, earningsIdr: 0, version: 0 };
    if ((wallet.earningsIdr ?? 0) < amountIdr) {
      throw new InsufficientBalanceError();
    }
    const newEarnings = (wallet.earningsIdr ?? 0) - amountIdr;
    const newVersion = wallet.version + 1;
    const now = Date.now();

    const updated: WalletDoc = {
      balance: wallet.balance,
      earningsIdr: newEarnings,
      version: newVersion,
      updatedAt: now,
    };
    this.wallets.set(uid, updated);
    this.ledger.push({
      id: `led_${Math.random()}`,
      uid,
      currency: 'idr',
      delta: -amountIdr,
      type,
      referenceId,
      note,
      createdAt: now,
    });
    return updated;
  }

  async createTopup(uid: string, input: CreateTopupInput): Promise<PaymentDoc> {
    const pkg = TOPUP_PACKAGES.find((p) => p.id === input.packageId);
    if (!pkg) throw new Error('Paket top-up tidak ditemukan.');

    const orderId = `TOPUP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();
    const session = await this.doku.createCheckout({ orderId, uid, amountIdr: pkg.priceIdr });

    const doc: PaymentDoc = {
      orderId,
      uid,
      packageId: pkg.id,
      coinAmount: pkg.totalCoins,
      amountIdr: pkg.priceIdr,
      paymentMethod: input.paymentMethod,
      status: 'pending',
      paymentUrl: session.redirectUrl,
      vaNumber: `80777${Math.floor(10000000 + Math.random() * 90000000)}`,
      qrString: `QRIS-${orderId}`,
      expiresAt: now + 3600000,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(orderId, doc);
    return doc;
  }

  async processPaymentSuccess(orderId: string, _payload?: unknown): Promise<PaymentDoc> {
    const payment = this.payments.get(orderId);
    if (!payment) throw new PaymentNotFoundError();
    if (payment.status === 'paid') return payment;

    const now = Date.now();
    const updated: PaymentDoc = { ...payment, status: 'paid', paidAt: now, updatedAt: now };
    this.payments.set(orderId, updated);
    await this.credit(
      payment.uid,
      payment.coinAmount,
      'topup',
      orderId,
      `Top Up ${payment.coinAmount} Coin`,
    );
    return updated;
  }

  async getPayment(orderId: string, uid?: string): Promise<PaymentDoc | null> {
    const payment = this.payments.get(orderId);
    if (!payment) return null;
    if (uid && payment.uid !== uid) return null;
    return payment;
  }
}
