import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { ref, uploadString, getBytes } from 'firebase/storage';
import { COLLECTIONS } from '@placetogo/shared';

const root = resolve(import.meta.dirname, '..');
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-placetogo',
    firestore: { rules: readFileSync(resolve(root, 'firestore.rules'), 'utf8') },
    storage: { rules: readFileSync(resolve(root, 'storage.rules'), 'utf8') },
  });
});
afterAll(async () => {
  await env.cleanup();
});

/** Data awal ditulis lewat konteks tanpa rules (setara Admin SDK). */
async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, COLLECTIONS.users, 'alice'), {
      displayName: 'Alice',
      avatarId: 'a1',
      cityId: 'jakarta',
      interests: [],
      createdAt: new Date(),
    });
    await setDoc(doc(db, COLLECTIONS.userPrivate, 'alice'), { email: 'alice@example.com' });
    await setDoc(doc(db, COLLECTIONS.userPrivate, 'bob'), { email: 'bob@example.com' });
    await setDoc(doc(db, COLLECTIONS.wallets, 'alice'), { balance: 100, version: 1 });
    await setDoc(doc(db, COLLECTIONS.walletLedger, 'l1'), { uid: 'alice', delta: 100 });
    await setDoc(doc(db, COLLECTIONS.payments, 'p1'), { uid: 'alice', amount: 10000 });
    await setDoc(doc(db, COLLECTIONS.reports, 'r1'), { reporterId: 'alice', subject: 'bob' });
    await setDoc(doc(db, COLLECTIONS.activities, 'act1'), {
      creatorId: 'alice',
      status: 'published',
      capacity: 4,
      participantCount: 1,
    });
    await setDoc(doc(db, COLLECTIONS.activities, 'draft1'), { creatorId: 'alice', status: 'draft' });
    await setDoc(doc(db, COLLECTIONS.conversations, 'c1'), { memberIds: ['alice', 'bob'] });
    await setDoc(doc(db, COLLECTIONS.conversations, 'c1', COLLECTIONS.messages, 'm1'), {
      senderId: 'alice',
      body: 'halo',
    });
  });
}
beforeEach(seed);

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

describe('anonim ditolak (Lampiran B)', () => {
  for (const [col, id] of [
    [COLLECTIONS.userPrivate, 'alice'],
    [COLLECTIONS.wallets, 'alice'],
    [COLLECTIONS.walletLedger, 'l1'],
    [COLLECTIONS.payments, 'p1'],
    [COLLECTIONS.reports, 'r1'],
    [COLLECTIONS.users, 'alice'],
  ] as const) {
    it(`tidak boleh membaca ${col}`, async () => {
      await assertFails(getDoc(doc(anon(), col, id)));
    });
  }
});

describe('user_private', () => {
  it('pemilik boleh membaca miliknya', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), COLLECTIONS.userPrivate, 'alice')));
  });
  it('pengguna lain tidak boleh membaca data privat orang lain', async () => {
    await assertFails(getDoc(doc(as('bob'), COLLECTIONS.userPrivate, 'alice')));
  });
  it('pengguna A tidak dapat mengubah data privat B', async () => {
    await assertFails(setDoc(doc(as('alice'), COLLECTIONS.userPrivate, 'bob'), { email: 'x@y.z' }));
  });
  it('bahkan pemilik tidak menulis langsung (lewat backend)', async () => {
    await assertFails(updateDoc(doc(as('alice'), COLLECTIONS.userPrivate, 'alice'), { email: 'x@y.z' }));
  });
});

describe('users (profil publik, backend-only sejak Fase 03)', () => {
  it('pengguna masuk dapat membaca profil publik', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), COLLECTIONS.users, 'alice')));
  });
  it('klien (termasuk pemilik) tidak dapat membuat profil langsung', async () => {
    await assertFails(
      setDoc(doc(as('carol'), COLLECTIONS.users, 'carol'), {
        displayName: 'Carol',
        avatarId: 'cat',
        cityId: 'bandung',
        interests: ['ngopi'],
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('akun lain tidak dapat mengubah profil', async () => {
    await assertFails(updateDoc(doc(as('bob'), COLLECTIONS.users, 'alice'), { displayName: 'Hacked' }));
  });
  it('pemilik pun tidak dapat mengubah profilnya langsung (lewat backend)', async () => {
    await assertFails(updateDoc(doc(as('alice'), COLLECTIONS.users, 'alice'), { displayName: 'Alice2' }));
  });
  it('tidak ada yang dapat menghapus profil', async () => {
    await assertFails(deleteDoc(doc(as('alice'), COLLECTIONS.users, 'alice')));
  });
});

describe('finansial: klien tidak boleh menulis', () => {
  it('pemilik boleh membaca saldo, tidak boleh menulis', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), COLLECTIONS.wallets, 'alice')));
    await assertFails(updateDoc(doc(as('alice'), COLLECTIONS.wallets, 'alice'), { balance: 999999 }));
  });
  it('pengguna lain tidak boleh membaca saldo', async () => {
    await assertFails(getDoc(doc(as('bob'), COLLECTIONS.wallets, 'alice')));
  });
  it('ledger dan payments tertutup total dari klien', async () => {
    await assertFails(getDoc(doc(as('alice'), COLLECTIONS.walletLedger, 'l1')));
    await assertFails(setDoc(doc(as('alice'), COLLECTIONS.walletLedger, 'l2'), { uid: 'alice', delta: 1e6 }));
    await assertFails(getDoc(doc(as('alice'), COLLECTIONS.payments, 'p1')));
    await assertFails(updateDoc(doc(as('alice'), COLLECTIONS.payments, 'p1'), { status: 'paid' }));
  });
  it('klien tidak dapat menulis webhook_events', async () => {
    await assertFails(setDoc(doc(as('alice'), COLLECTIONS.webhookEvents, 'w1'), { ok: true }));
  });
  it('klien tidak dapat mengklaim status admin', async () => {
    await assertFails(setDoc(doc(as('alice'), 'admins', 'alice'), { role: 'admin' }));
  });
});

describe('activities', () => {
  it('ajakan published dapat dibaca publik, draft hanya pembuat', async () => {
    await assertSucceeds(getDoc(doc(anon(), COLLECTIONS.activities, 'act1')));
    await assertFails(getDoc(doc(anon(), COLLECTIONS.activities, 'draft1')));
    await assertFails(getDoc(doc(as('bob'), COLLECTIONS.activities, 'draft1')));
    await assertSucceeds(getDoc(doc(as('alice'), COLLECTIONS.activities, 'draft1')));
  });
  it('klien tidak dapat menulis/mengubah ajakan atau kapasitas', async () => {
    await assertFails(updateDoc(doc(as('alice'), COLLECTIONS.activities, 'act1'), { capacity: 999 }));
    await assertFails(updateDoc(doc(as('bob'), COLLECTIONS.activities, 'act1'), { participantCount: 0 }));
    await assertFails(setDoc(doc(as('bob'), COLLECTIONS.activities, 'new'), { creatorId: 'bob' }));
  });
  it('klien tidak dapat menulis participants/join_requests', async () => {
    await assertFails(
      setDoc(doc(as('bob'), COLLECTIONS.activities, 'act1', COLLECTIONS.participants, 'bob'), { status: 'joined' }),
    );
    await assertFails(
      setDoc(doc(as('bob'), COLLECTIONS.activities, 'act1', COLLECTIONS.joinRequests, 'bob'), { status: 'pending' }),
    );
  });

  // Discovery (Fase 04): query list hanya diizinkan Firestore bila rules bisa dibuktikan
  // berlaku untuk SEMUA kandidat hasil query tanpa membaca datanya dulu. Karena rule kita
  // ("status != draft ATAU pemilik") sudah terjamin oleh filter status di query, list
  // dengan filter itu berhasil; tanpa filter, Firestore menolak seluruh query (bukan
  // menyaring diam-diam) karena draft1 bisa saja ikut terbawa. Ini bukti nyata mengapa
  // lib/activities/read.ts WAJIB selalu menyertakan `where('status','in',[...])`.
  it('query list ajakan aktif berhasil bila menyertakan filter status; gagal total tanpa filter itu', async () => {
    const activeQuery = query(collection(as('bob'), COLLECTIONS.activities), where('status', 'in', ['published', 'full']));
    const snap = await assertSucceeds(getDocs(activeQuery));
    expect(snap.docs.map((d) => d.id)).toEqual(['act1']);

    const unconstrainedQuery = query(collection(as('bob'), COLLECTIONS.activities));
    await assertFails(getDocs(unconstrainedQuery));
  });
});

describe('chat', () => {
  it('anggota dapat membaca percakapan dan pesan', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), COLLECTIONS.conversations, 'c1')));
    await assertSucceeds(getDoc(doc(as('bob'), COLLECTIONS.conversations, 'c1', COLLECTIONS.messages, 'm1')));
  });
  it('non-anggota tidak dapat membaca atau mengirim', async () => {
    await assertFails(getDoc(doc(as('mallory'), COLLECTIONS.conversations, 'c1')));
    await assertFails(getDoc(doc(as('mallory'), COLLECTIONS.conversations, 'c1', COLLECTIONS.messages, 'm1')));
    await assertFails(
      setDoc(doc(as('mallory'), COLLECTIONS.conversations, 'c1', COLLECTIONS.messages, 'x'), {
        senderId: 'mallory',
        body: 'hai',
      }),
    );
  });
});

describe('reports dan koleksi tak dikenal', () => {
  it('reports tertutup dari klien (identitas pelapor tidak bocor)', async () => {
    await assertFails(getDoc(doc(as('bob'), COLLECTIONS.reports, 'r1')));
    await assertFails(getDoc(doc(as('alice'), COLLECTIONS.reports, 'r1')));
  });
  it('koleksi tak dikenal ditolak (deny-by-default)', async () => {
    await assertFails(setDoc(doc(as('alice'), 'sesuatu', 'x'), { a: 1 }));
    await assertFails(getDoc(doc(as('alice'), 'sesuatu', 'x')));
  });
});

describe('Storage deny-by-default', () => {
  it('kontrol positif: emulator Storage aktif (tanpa rules tulis berhasil)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadString(ref(ctx.storage(), 'kontrol/ok.txt'), 'x');
    });
  });
  it('menolak baca dan tulis', async () => {
    const storage = env.authenticatedContext('alice').storage();
    await assertFails(uploadString(ref(storage, 'avatars/alice.png'), 'x'));
    await assertFails(getBytes(ref(storage, 'avatars/alice.png')));
  });
  it('menolak anonim', async () => {
    const storage = env.unauthenticatedContext().storage();
    await assertFails(uploadString(ref(storage, 'apa-saja.txt'), 'x'));
  });
});
