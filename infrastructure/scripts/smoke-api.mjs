// Smoke test: menjalankan API hasil build terhadap Firebase Emulator dan memeriksa
// /healthz, /readyz, serta penolakan token palsu oleh verifikasi Admin SDK sungguhan.
// Dijalankan lewat: pnpm smoke:api  (emulators:exec menyetel *_EMULATOR_HOST).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const apiDir = fileURLToPath(new URL('../../services/api/', import.meta.url));
const PORT = 18080;
const base = `http://127.0.0.1:${PORT}`;

const server = spawn(process.execPath, ['dist/server.js'], {
  cwd: apiDir,
  env: { ...process.env, PORT: String(PORT), FIREBASE_PROJECT_ID: 'demo-placetogo', LOG_LEVEL: 'warn' },
  stdio: 'inherit',
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.warn(`${ok ? 'PASS' : 'FAIL'}  ${name} ${detail}`);
};

async function waitReady() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/healthz`)).ok) return;
    } catch {
      /* server belum siap */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server tidak siap');
}

try {
  await waitReady();
  const health = await fetch(`${base}/healthz`);
  check('GET /healthz 200', health.status === 200);

  const ready = await fetch(`${base}/readyz`);
  const readyBody = await ready.json();
  check('GET /readyz 200 (Firestore emulator terjangkau)', ready.status === 200, JSON.stringify(readyBody.checks));

  const noToken = await fetch(`${base}/v1/me`);
  check('GET /v1/me tanpa token -> 401', noToken.status === 401);

  const fake = await fetch(`${base}/v1/me`, { headers: { authorization: 'Bearer token.palsu.sekali' } });
  check('GET /v1/me token palsu -> 401', fake.status === 401);

  const admin = await fetch(`${base}/v1/admin/ping`, { headers: { authorization: 'Bearer token.palsu.sekali' } });
  check('GET /v1/admin/ping token palsu -> 401', admin.status === 401);
} catch (e) {
  check('smoke berjalan', false, String(e));
} finally {
  server.kill();
}

process.exit(results.every(Boolean) ? 0 : 1);
