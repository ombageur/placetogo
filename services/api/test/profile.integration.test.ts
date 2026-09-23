/**
 * Uji integrasi profil: Admin SDK sungguhan terhadap Auth + Firestore Emulator.
 * Jalankan lewat `pnpm test:integration` (emulators:exec menyetel *_EMULATOR_HOST).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@placetogo/shared';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { initFirebase } from '../src/lib/firebase.js';
import { createTokenVerifier } from '../src/lib/token-verifier.js';
import { createFirestoreAccountStore } from '../src/modules/accounts/store.js';
import { createFirestoreProfileStore } from '../src/modules/profile/store.js';
import * as emu from './emulator.js';

const PASSWORD = 'RahasiaSekali2026';
let app: FastifyInstance;

beforeAll(async () => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Jalankan lewat `pnpm test:integration` agar emulator aktif.');
  }
  const env = loadEnv({ FIREBASE_PROJECT_ID: 'demo-placetogo', LOG_LEVEL: 'silent', ...process.env });
  const { auth, db } = initFirebase(env);
  app = await buildApp({
    env,
    verifyToken: createTokenVerifier(auth),
    accounts: createFirestoreAccountStore(db),
    profiles: createFirestoreProfileStore(db),
    readiness: {},
  });
});
afterAll(async () => {
  await app.close();
});

async function verifiedUser(tag: string) {
  const email = emu.uniqueEmail(tag);
  const s = await emu.signUp(email, PASSWORD);
  await emu.requestVerification(s.idToken);
  await emu.applyVerification(await emu.latestOobCode(email, 'VERIFY_EMAIL'));
  return emu.signIn(email, PASSWORD); // token baru membawa klaim email_verified terbaru
}

const put = (token: string, body: unknown) =>
  app.inject({ method: 'PUT', url: '/v1/me/profile', headers: { authorization: `Bearer ${token}` }, payload: body });
const get = (url: string, token: string) => app.inject({ url, headers: { authorization: `Bearer ${token}` } });

const PROFILE = {
  displayName: 'KopiSenja',
  avatarId: 'cat',
  bio: 'Suka ngopi dan baca buku.',
  cityId: 'jakarta',
  cityVisible: true,
  interests: ['ngopi', 'buku'],
};

describe('profil: keterkaitan users + user_private di Firestore sungguhan', () => {
  it('PUT menandai user_private.profileComplete=true dan GET /v1/me melihat stage ready', async () => {
    const s = await verifiedUser('prof');
    const before = await get('/v1/me', s.idToken);
    expect(before.json()).toMatchObject({ stage: 'profile_incomplete', profileComplete: false });

    const res = await put(s.idToken, PROFILE);
    expect(res.statusCode).toBe(200);

    const after = await get('/v1/me', s.idToken);
    expect(after.json()).toMatchObject({ stage: 'ready', profileComplete: true });

    const pub = await getFirestore().collection(COLLECTIONS.users).doc(s.localId).get();
    expect(pub.data()).toMatchObject({ displayName: 'KopiSenja', avatarId: 'cat', cityId: 'jakarta' });
    expect(pub.data()?.createdAt).toBeDefined();
  });

  it('cityVisible=false menghilangkan cityId dari dokumen publik, tetap tersimpan privat', async () => {
    const s = await verifiedUser('privasi');
    await put(s.idToken, { ...PROFILE, cityVisible: false });

    const pub = await getFirestore().collection(COLLECTIONS.users).doc(s.localId).get();
    expect(pub.data()).not.toHaveProperty('cityId');

    const priv = await getFirestore().collection(COLLECTIONS.userPrivate).doc(s.localId).get();
    expect(priv.data()).toMatchObject({ cityId: 'jakarta', cityVisible: false, profileComplete: true });

    // Pemilik tetap melihat cityId asli lewat GET /v1/me/profile.
    expect((await get('/v1/me/profile', s.idToken)).json()).toMatchObject({ cityId: 'jakarta', cityVisible: false });
  });

  it('mengedit profil mempertahankan createdAt, memperbarui updatedAt, dan bisa mengaktifkan kembali cityVisible', async () => {
    const s = await verifiedUser('edit');
    await put(s.idToken, { ...PROFILE, cityVisible: false });
    const createdAtBefore = (await getFirestore().collection(COLLECTIONS.users).doc(s.localId).get()).data()?.createdAt;

    await new Promise((r) => setTimeout(r, 1100));
    await put(s.idToken, { ...PROFILE, displayName: 'KopiSenja2', cityVisible: true });

    const pubAfter = (await getFirestore().collection(COLLECTIONS.users).doc(s.localId).get()).data();
    expect(pubAfter?.displayName).toBe('KopiSenja2');
    expect(pubAfter?.cityId).toBe('jakarta');
    expect(pubAfter?.createdAt.toMillis()).toBe(createdAtBefore.toMillis());
    expect(pubAfter?.updatedAt.toMillis()).toBeGreaterThan(createdAtBefore.toMillis());
  });

  it('email belum terverifikasi tidak dapat menyimpan profil', async () => {
    const email = emu.uniqueEmail('belum');
    const s = await emu.signUp(email, PASSWORD);
    const res = await put(s.idToken, PROFILE);
    expect(res.statusCode).toBe(403);
  });

  it('dua pengguna berbeda tidak saling menimpa profil (uid selalu dari token)', async () => {
    const a = await verifiedUser('multi-a');
    const b = await verifiedUser('multi-b');
    await put(a.idToken, { ...PROFILE, displayName: 'Alice' });
    await put(b.idToken, { ...PROFILE, displayName: 'Bob' });
    expect((await get('/v1/me/profile', a.idToken)).json().displayName).toBe('Alice');
    expect((await get('/v1/me/profile', b.idToken)).json().displayName).toBe('Bob');
  });

  it('anonim/token palsu tidak dapat membaca atau menulis profil siapa pun', async () => {
    expect((await get('/v1/me/profile', 'token-ngawur')).statusCode).toBe(401);
    expect((await put('token-ngawur', PROFILE)).statusCode).toBe(401);
  });
});
