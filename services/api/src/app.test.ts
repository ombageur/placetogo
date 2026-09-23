import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createMemoryAccountStore } from './modules/accounts/store.js';
import { createMemoryProfileStore } from './modules/profile/store.js';
import { createFakePlacesGateway } from './modules/maps/contract.js';
import { createMemoryActivityStore } from './modules/activities/store.js';

let app: FastifyInstance;

const TOKENS: Record<string, { uid: string; emailVerified: boolean; admin: boolean }> = {
  'user-token': { uid: 'u1', emailVerified: true, admin: false },
  'user2-token': { uid: 'u3', emailVerified: true, admin: false },
  'unverified-token': { uid: 'u2', emailVerified: false, admin: false },
  'admin-token': { uid: 'a1', emailVerified: true, admin: true },
};

async function make(readiness: Record<string, () => Promise<void>> = {}) {
  const accounts = createMemoryAccountStore();
  const profiles = createMemoryProfileStore();
  const places = createFakePlacesGateway();
  const activities = createMemoryActivityStore();
  app = await buildApp({
    env: { LOG_LEVEL: 'silent', WEB_ORIGIN: 'http://localhost:3000' },
    verifyToken: async (token) => {
      const t = TOKENS[token];
      if (!t) throw new Error('invalid');
      return t;
    },
    accounts,
    profiles,
    places,
    activities,
    readiness,
  });
  return { app, accounts, profiles, places, activities };
}

const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

afterEach(async () => {
  await app?.close();
});

describe('health', () => {
  it('/healthz ok tanpa dependensi', async () => {
    const res = await (await make()).app.inject('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('/readyz 200 saat dependensi sehat', async () => {
    const res = await (await make({ firestore: async () => {} })).app.inject('/readyz');
    expect(res.statusCode).toBe(200);
  });

  it('/readyz 503 saat dependensi gagal', async () => {
    const res = await (
      await make({
        firestore: async () => {
          throw new Error('down');
        },
      })
    ).app.inject('/readyz');
    expect(res.statusCode).toBe(503);
    expect(res.json().checks.firestore).toBe('fail');
  });
});

describe('autentikasi server-side', () => {
  it('menolak tanpa token', async () => {
    const res = await (await make()).app.inject('/v1/me');
    expect(res.statusCode).toBe(401);
  });

  it('menolak token palsu dengan pesan seragam', async () => {
    const { app: a } = await make();
    const fake = await a.inject({ url: '/v1/me', headers: bearer('palsu') });
    const none = await a.inject('/v1/me');
    expect(fake.statusCode).toBe(401);
    expect(fake.json()).toEqual(none.json());
  });

  it('menolak skema Authorization selain Bearer', async () => {
    const res = await (await make()).app.inject({ url: '/v1/me', headers: { authorization: 'Basic dXNlcjpwYXNz' } });
    expect(res.statusCode).toBe(401);
  });

  it('identitas berasal dari token, bukan dari query/body', async () => {
    const res = await (await make()).app.inject({
      url: '/v1/me?uid=a1',
      headers: bearer('user-token'),
    });
    expect(res.json().uid).toBe('u1');
  });

  it('pengguna biasa tidak dapat membuka endpoint admin', async () => {
    const res = await (await make()).app.inject({ url: '/v1/admin/ping', headers: bearer('user-token') });
    expect(res.statusCode).toBe(403);
  });

  it('admin dapat membuka endpoint admin', async () => {
    const res = await (await make()).app.inject({ url: '/v1/admin/ping', headers: bearer('admin-token') });
    expect(res.statusCode).toBe(200);
  });
});

describe('akun dan tahap onboarding', () => {
  it('GET /v1/me belum terinisialisasi tidak membuat dokumen (tanpa efek samping)', async () => {
    const { app: a, accounts } = await make();
    const res = await a.inject({ url: '/v1/me', headers: bearer('user-token') });
    expect(res.json()).toMatchObject({ initialized: false, profileComplete: false, stage: 'profile_incomplete' });
    expect(accounts.docs.size).toBe(0);
  });

  it('email belum terverifikasi -> tahap verify_email', async () => {
    const res = await (await make()).app.inject({ url: '/v1/me', headers: bearer('unverified-token') });
    expect(res.json()).toMatchObject({ emailVerified: false, stage: 'verify_email' });
  });

  it('POST /v1/me/init membuat dokumen dan idempoten', async () => {
    const { app: a, accounts } = await make();
    const first = await a.inject({ method: 'POST', url: '/v1/me/init', headers: bearer('user-token') });
    const second = await a.inject({ method: 'POST', url: '/v1/me/init', headers: bearer('user-token') });
    expect(first.json()).toMatchObject({ uid: 'u1', initialized: true, profileComplete: false });
    expect(second.json()).toEqual(first.json());
    expect(accounts.docs.size).toBe(1);
  });

  it('POST /v1/me/init tanpa token -> 401', async () => {
    const res = await (await make()).app.inject({ method: 'POST', url: '/v1/me/init' });
    expect(res.statusCode).toBe(401);
  });

  it('endpoint khusus terverifikasi menolak email belum terverifikasi (403) dan menerima yang terverifikasi', async () => {
    const { app: a } = await make();
    const no = await a.inject({ url: '/v1/verified/ping', headers: bearer('unverified-token') });
    const yes = await a.inject({ url: '/v1/verified/ping', headers: bearer('user-token') });
    expect(no.statusCode).toBe(403);
    expect(no.json().error).toBe('email_not_verified');
    expect(yes.statusCode).toBe(200);
  });
});

describe('CORS', () => {
  // Regresi: browser memblokir PUT (preflight gagal) bila 'PUT' tidak ada di Access-Control-Allow-Methods,
  // meski panggilan langsung (curl/Node fetch tanpa penegakan CORS) tetap terlihat berhasil.
  it('preflight mengizinkan PUT (dipakai simpan profil) dari WEB_ORIGIN', async () => {
    const res = await (
      await make()
    ).app.inject({
      method: 'OPTIONS',
      url: '/v1/me/profile',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'authorization,content-type',
      },
    });
    expect(res.statusCode).toBeLessThan(300);
    expect(res.headers['access-control-allow-methods']).toContain('PUT');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('preflight mengizinkan PATCH dan DELETE (dipakai kapasitas & keluar ajakan)', async () => {
    const a = (await make()).app;
    for (const method of ['PATCH', 'DELETE']) {
      const res = await a.inject({
        method: 'OPTIONS',
        url: '/v1/activities/x/capacity',
        headers: { origin: 'http://localhost:3000', 'access-control-request-method': method },
      });
      expect(res.headers['access-control-allow-methods']).toContain(method);
    }
  });
});

describe('rate limit dan galat aman', () => {
  it('/v1/me/init dibatasi 10 per menit lalu 429 berpesan Indonesia', async () => {
    const { app: a } = await make();
    let last = 0;
    for (let i = 0; i < 11; i++) {
      last = (await a.inject({ method: 'POST', url: '/v1/me/init', headers: bearer('user-token') })).statusCode;
    }
    expect(last).toBe(429);
    const res = await a.inject({ method: 'POST', url: '/v1/me/init', headers: bearer('user-token') });
    expect(res.json().message).toMatch(/Terlalu banyak permintaan/);
  });

  it('rute tak dikenal mengembalikan 404 generik', async () => {
    const res = await (await make()).app.inject('/v1/tidak-ada');
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('not_found');
  });
});

describe('validasi environment', () => {
  const base = { FIREBASE_PROJECT_ID: 'demo-placetogo' };

  it('menerima konfigurasi development minimal', () => {
    expect(loadEnv(base).PORT).toBe(8080);
  });

  it('gagal bila FIREBASE_PROJECT_ID hilang', () => {
    expect(() => loadEnv({})).toThrow(/FIREBASE_PROJECT_ID/);
  });

  it('production menolak emulator, project demo, dan DOKU production', () => {
    expect(() =>
      loadEnv({ ...base, APP_ENV: 'production', FIRESTORE_EMULATOR_HOST: 'localhost:8080' }),
    ).toThrow();
    expect(() => loadEnv({ ...base, APP_ENV: 'production' })).toThrow(/demo-/);
    expect(() =>
      loadEnv({ APP_ENV: 'production', FIREBASE_PROJECT_ID: 'real', DOKU_ENVIRONMENT: 'production' }),
    ).toThrow(/DOKU/);
  });

  it('production menolak allowlist rate limit', () => {
    expect(() =>
      loadEnv({ APP_ENV: 'production', FIREBASE_PROJECT_ID: 'real', RATE_LIMIT_ALLOWLIST: '127.0.0.1' }),
    ).toThrow(/Allowlist/);
    expect(loadEnv({ ...base, RATE_LIMIT_ALLOWLIST: '1.1.1.1, 2.2.2.2' }).RATE_LIMIT_ALLOWLIST).toEqual(['1.1.1.1', '2.2.2.2']);
  });

  it('pesan error tidak membocorkan nilai secret', () => {
    try {
      loadEnv({ ...base, PORT: 'rahasia-123' });
    } catch (e) {
      expect(String(e)).not.toContain('rahasia-123');
    }
  });
});

const VALID_PROFILE = {
  displayName: 'KopiSenja',
  avatarId: 'cat',
  bio: 'Suka ngopi dan baca buku.',
  cityId: 'jakarta',
  cityVisible: true,
  interests: ['ngobrol', 'buku'],
};

describe('profil', () => {
  it('GET sebelum pernah disimpan -> 404', async () => {
    const res = await (await make()).app.inject({ url: '/v1/me/profile', headers: bearer('user-token') });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('profile_not_found');
  });

  it('GET/PUT tanpa token -> 401', async () => {
    const { app: a } = await make();
    expect((await a.inject('/v1/me/profile')).statusCode).toBe(401);
    expect((await a.inject({ method: 'PUT', url: '/v1/me/profile', payload: VALID_PROFILE })).statusCode).toBe(401);
  });

  it('PUT mensyaratkan email terverifikasi', async () => {
    const res = await (
      await make()
    ).app.inject({ method: 'PUT', url: '/v1/me/profile', headers: bearer('unverified-token'), payload: VALID_PROFILE });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('email_not_verified');
  });

  it('PUT valid menyimpan dan GET mengembalikannya', async () => {
    const { app: a } = await make();
    const put = await a.inject({ method: 'PUT', url: '/v1/me/profile', headers: bearer('user-token'), payload: VALID_PROFILE });
    expect(put.statusCode).toBe(200);
    expect(put.json()).toEqual(VALID_PROFILE);

    const get = await a.inject({ url: '/v1/me/profile', headers: bearer('user-token') });
    expect(get.json()).toEqual(VALID_PROFILE);
    // PUT menandai user_private.profileComplete=true di Firestore sungguhan (dokumen sama
    // dengan yang dibaca AccountStore); double memori di tes ini memakai Map terpisah per
    // store, jadi keterkaitan itu diverifikasi di test/profile.integration.test.ts.
  });

  it('memindahkan id minat lama ke penggantinya, tetapi menolak yang tidak dikenal', async () => {
    const { app: a } = await make();

    // 'ngopi' adalah id lama yang kini menjadi 'kuliner'; profil lama tetap bisa disimpan.
    const migrated = await a.inject({
      method: 'PUT',
      url: '/v1/me/profile',
      headers: bearer('user-token'),
      payload: { ...VALID_PROFILE, interests: ['ngopi', 'buku'] },
    });
    expect(migrated.statusCode).toBe(200);
    expect(migrated.json().interests).toEqual(['kuliner', 'buku']);

    // Nilai di luar katalog tidak boleh diterima diam-diam sebagai minat bawaan.
    const rejected = await a.inject({
      method: 'PUT',
      url: '/v1/me/profile',
      headers: bearer('user-token'),
      payload: { ...VALID_PROFILE, interests: ['ngawur'] },
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json().fields).toHaveProperty('interests');
  });

  it('menolak displayName, avatarId, cityId, dan interests yang tidak valid dengan fields per kolom', async () => {
    const { app: a } = await make();
    const res = await a.inject({
      method: 'PUT',
      url: '/v1/me/profile',
      headers: bearer('user-token'),
      payload: { ...VALID_PROFILE, displayName: 'A', avatarId: 'naga', interests: [] },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('validation_error');
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(['displayName', 'avatarId', 'interests']));
  });

  it('bio kosong diterima (opsional)', async () => {
    const res = await (
      await make()
    ).app.inject({ method: 'PUT', url: '/v1/me/profile', headers: bearer('user-token'), payload: { ...VALID_PROFILE, bio: '' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().bio).toBeUndefined();
  });

  it('uid ekstra pada body diabaikan; identitas tetap dari token', async () => {
    const { app: a, profiles } = await make();
    await a.inject({
      method: 'PUT',
      url: '/v1/me/profile',
      headers: bearer('user-token'),
      payload: { ...VALID_PROFILE, uid: 'orang-lain' },
    });
    expect(profiles.docs.has('u1')).toBe(true);
    expect(profiles.docs.has('orang-lain')).toBe(false);
  });

  it('pengguna B tidak dapat membaca atau menimpa profil pengguna A lewat rute ini', async () => {
    const { app: a, profiles } = await make();
    await a.inject({ method: 'PUT', url: '/v1/me/profile', headers: bearer('user-token'), payload: VALID_PROFILE });
    const other = { ...VALID_PROFILE, displayName: 'Penyusup' };
    await a.inject({ method: 'PUT', url: '/v1/me/profile', headers: bearer('user2-token'), payload: other });
    expect(profiles.docs.get('u1')?.displayName).toBe('KopiSenja');
    expect(profiles.docs.get('u3')?.displayName).toBe('Penyusup');
  });
});

describe('places (proksi Places API, kunci server tidak pernah ke klien)', () => {
  it('autocomplete tanpa token -> 401; dengan token meneruskan ke gateway', async () => {
    const { app: a, places } = await make();
    const noAuth = await a.inject('/v1/places/autocomplete?input=kopi&sessionToken=sess-1');
    expect(noAuth.statusCode).toBe(401);

    const res = await a.inject({ url: '/v1/places/autocomplete?input=kopi&sessionToken=sess-1', headers: bearer('user-token') });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([{ placeId: 'fake-place-1', primaryText: 'Hasil untuk "kopi"', secondaryText: 'Jakarta, Indonesia' }]);
    expect(places.calls.autocomplete).toBe(1);
  });

  it('autocomplete menolak input kosong dan sessionToken hilang (validasi sebelum menyentuh gateway)', async () => {
    const { app: a, places } = await make();
    const empty = await a.inject({ url: '/v1/places/autocomplete?input=&sessionToken=sess-1', headers: bearer('user-token') });
    const noToken = await a.inject({ url: '/v1/places/autocomplete?input=kopi', headers: bearer('user-token') });
    expect(empty.statusCode).toBe(400);
    expect(noToken.statusCode).toBe(400);
    expect(places.calls.autocomplete).toBe(0);
  });

  it('getPlace mengembalikan detail dari gateway, menolak tanpa sessionToken', async () => {
    const { app: a, places } = await make();
    const res = await a.inject({ url: '/v1/places/abc123?sessionToken=sess-1', headers: bearer('user-token') });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ placeId: 'abc123', name: 'Tempat Contoh', formattedAddress: 'Jl. Contoh No. 1, Jakarta', lat: -6.2, lng: 106.8 });
    expect(places.calls.getPlace).toBe(1);

    const noToken = await a.inject({ url: '/v1/places/abc123', headers: bearer('user-token') });
    expect(noToken.statusCode).toBe(400);
  });

  it('galat gateway diteruskan sebagai 502 tanpa membocorkan detail internal', async () => {
    // Instance app terpisah dengan gateway yang sengaja selalu gagal.
    const failing = {
      calls: { autocomplete: 0, getPlace: 0 },
      autocomplete: async () => {
        throw new Error('rahasia-internal-google');
      },
      getPlace: async () => {
        throw new Error('rahasia-internal-google');
      },
    };
    const app2 = await buildApp({
      env: { LOG_LEVEL: 'silent', WEB_ORIGIN: 'http://localhost:3000' },
      verifyToken: async (token) => {
        const t = TOKENS[token];
        if (!t) throw new Error('invalid');
        return t;
      },
      accounts: createMemoryAccountStore(),
      profiles: createMemoryProfileStore(),
      places: failing,
      activities: createMemoryActivityStore(),
      readiness: {},
    });
    const res = await app2.inject({ url: '/v1/places/autocomplete?input=kopi&sessionToken=s1', headers: bearer('user-token') });
    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.json())).not.toContain('rahasia-internal-google');
    await app2.close();
  });
});
