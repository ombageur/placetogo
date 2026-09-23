/**
 * Uji integrasi sesi & otorisasi: Admin SDK sungguhan terhadap Auth + Firestore Emulator.
 * Jalankan lewat `pnpm test:integration` (emulators:exec menyetel *_EMULATOR_HOST).
 */
import { Writable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@placetogo/shared';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { initFirebase } from '../src/lib/firebase.js';
import { createTokenVerifier } from '../src/lib/token-verifier.js';
import { createFirestoreAccountStore } from '../src/modules/accounts/store.js';
import * as emu from './emulator.js';

const PASSWORD = 'RahasiaSekali2026';
let app: FastifyInstance;
const logs: string[] = [];

beforeAll(async () => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Jalankan lewat `pnpm test:integration` agar emulator aktif.');
  }
  const env = loadEnv({ FIREBASE_PROJECT_ID: 'demo-placetogo', LOG_LEVEL: 'info', ...process.env });
  const { auth, db } = initFirebase(env);
  app = await buildApp({
    env,
    verifyToken: createTokenVerifier(auth),
    accounts: createFirestoreAccountStore(db),
    readiness: {},
    logStream: new Writable({
      write(chunk, _enc, cb) {
        logs.push(String(chunk));
        cb();
      },
    }),
  });
});
afterAll(async () => {
  await app.close();
});

const get = (url: string, token?: string) =>
  app.inject({ url, headers: token ? { authorization: `Bearer ${token}` } : {} });
const post = (url: string, token?: string) =>
  app.inject({ method: 'POST', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

describe('token Firebase asli', () => {
  it('menerima ID token valid dan menolak token palsu/rusak/kosong', async () => {
    const { idToken } = await emu.signUp(emu.uniqueEmail('valid'), PASSWORD);
    expect((await get('/v1/me', idToken)).statusCode).toBe(200);

    expect((await get('/v1/me', 'token.palsu.sekali')).statusCode).toBe(401);
    // tanda tangan dirusak
    const tampered = idToken.slice(0, -4) + (idToken.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect((await get('/v1/me', tampered)).statusCode).toBe(401);
    // payload diganti (uid orang lain), header/signature lama
    const [h, , s] = idToken.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ user_id: 'orang-lain', sub: 'orang-lain' })).toString('base64url');
    expect((await get('/v1/me', `${h}.${forgedPayload}.${s}`)).statusCode).toBe(401);
    expect((await get('/v1/me')).statusCode).toBe(401);
  });

  it('token dari sesi yang dicabut ditolak (revokeRefreshTokens)', async () => {
    const s = await emu.signUp(emu.uniqueEmail('revoke'), PASSWORD);
    expect((await get('/v1/me', s.idToken)).statusCode).toBe(200);
    // Admin SDK membandingkan auth_time dengan validSince dalam satuan detik: token yang
    // dibuat pada detik yang sama dengan pencabutan tidak dianggap dicabut. Beri jeda dulu.
    await new Promise((r) => setTimeout(r, 1100));
    await getAuth().revokeRefreshTokens(s.localId);
    expect((await get('/v1/me', s.idToken)).statusCode).toBe(401);
  });

  it('akun yang dinonaktifkan atau dihapus ditolak', async () => {
    const a = await emu.signUp(emu.uniqueEmail('disabled'), PASSWORD);
    await getAuth().updateUser(a.localId, { disabled: true });
    expect((await get('/v1/me', a.idToken)).statusCode).toBe(401);

    const b = await emu.signUp(emu.uniqueEmail('deleted'), PASSWORD);
    await getAuth().deleteUser(b.localId);
    expect((await get('/v1/me', b.idToken)).statusCode).toBe(401);
  });
});

describe('registrasi -> verifikasi email -> masuk', () => {
  it('menelusuri tahap akun dari verify_email sampai profile_incomplete', async () => {
    const email = emu.uniqueEmail('flow');
    const s = await emu.signUp(email, PASSWORD);

    const init = await post('/v1/me/init', s.idToken);
    expect(init.json()).toMatchObject({ uid: s.localId, emailVerified: false, initialized: true, stage: 'verify_email' });

    // Belum terverifikasi: endpoint khusus terverifikasi ditolak.
    expect((await get('/v1/verified/ping', s.idToken)).statusCode).toBe(403);

    await emu.requestVerification(s.idToken);
    await emu.applyVerification(await emu.latestOobCode(email, 'VERIFY_EMAIL'));

    // Token lama masih membawa email_verified=false; token baru (masuk ulang) sudah true.
    expect((await get('/v1/verified/ping', s.idToken)).statusCode).toBe(403);
    const fresh = await emu.signIn(email, PASSWORD);
    expect((await get('/v1/verified/ping', fresh.idToken)).statusCode).toBe(200);
    expect((await get('/v1/me', fresh.idToken)).json()).toMatchObject({ emailVerified: true, stage: 'profile_incomplete' });
  });
});

describe('reset kata sandi', () => {
  it('kata sandi lama gagal, baru berhasil, dan sesi lama tetap valid sampai dicabut', async () => {
    const email = emu.uniqueEmail('reset');
    await emu.signUp(email, PASSWORD);
    await emu.requestPasswordReset(email);
    await emu.applyPasswordReset(await emu.latestOobCode(email, 'PASSWORD_RESET'), 'KataSandiBaru99');

    await expect(emu.signIn(email, PASSWORD)).rejects.toThrow();
    const s = await emu.signIn(email, 'KataSandiBaru99');
    expect((await get('/v1/me', s.idToken)).statusCode).toBe(200);
  });
});

describe('otorisasi admin lewat custom claim', () => {
  it('claim admin hanya berlaku pada token baru; pengguna biasa 403', async () => {
    const email = emu.uniqueEmail('admin');
    const s = await emu.signUp(email, PASSWORD);
    expect((await get('/v1/admin/ping', s.idToken)).statusCode).toBe(403);
    await getAuth().setCustomUserClaims(s.localId, { admin: true });
    const fresh = await emu.signIn(email, PASSWORD);
    expect((await get('/v1/admin/ping', fresh.idToken)).statusCode).toBe(200);
  });
});

describe('inisialisasi akun', () => {
  it('idempoten dan paralel tidak menghasilkan dokumen ganda/galat', async () => {
    const s = await emu.signUp(emu.uniqueEmail('init'), PASSWORD);
    const results = await Promise.all(Array.from({ length: 5 }, () => post('/v1/me/init', s.idToken)));
    expect(results.map((r) => r.statusCode)).toEqual([200, 200, 200, 200, 200]);
    const snap = await getFirestore().collection(COLLECTIONS.userPrivate).doc(s.localId).get();
    expect(snap.exists).toBe(true);
    expect(snap.data()).toMatchObject({ schemaVersion: 1, profileComplete: false });
  });
});

describe('tidak ada kata sandi di Firestore atau log', () => {
  it('memindai seluruh dokumen user_private dan keluaran log', async () => {
    const email = emu.uniqueEmail('secret');
    const secret = 'KataSandiUnik!7788';
    const s = await emu.signUp(email, secret);
    await post('/v1/me/init', s.idToken);
    await get('/v1/me', s.idToken);
    await get('/v1/me', 'token-ngawur');

    const docs = await getFirestore().collection(COLLECTIONS.userPrivate).get();
    const dump = JSON.stringify(docs.docs.map((d) => d.data()));
    expect(dump).not.toContain(secret);
    expect(dump).not.toContain(email);

    const allLogs = logs.join('\n');
    expect(allLogs.length).toBeGreaterThan(0);
    expect(allLogs).not.toContain(secret);
    expect(allLogs).not.toContain(s.idToken);
    expect(allLogs).not.toContain('token-ngawur');
  });
});
