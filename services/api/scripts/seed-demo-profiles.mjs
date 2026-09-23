/**
 * Melengkapi profil akun demo lewat API, supaya setelah masuk langsung sampai ke Beranda
 * dan tidak terhenti di layar "Lengkapi profil".
 *
 * Hanya untuk emulator. Jalankan setelah seed-demo-users.mjs, dengan API dan emulator hidup:
 *   node services/api/scripts/seed-demo-profiles.mjs
 */

const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key';
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8081';

const PROFILES = [
  {
    email: 'admin@placetogo.test',
    password: 'DemoAdmin2026',
    profile: {
      displayName: 'KopiSenja',
      avatarId: 'cat',
      cityId: 'jakarta',
      cityVisible: true,
      bio: 'Suka ngopi, buku, dan obrolan santai.',
      interests: ['ngobrol', 'buku', 'komunitas'],
    },
  },
  {
    email: 'demo@placetogo.test',
    password: 'DemoUser2026',
    profile: {
      displayName: 'Nara',
      avatarId: 'fox',
      cityId: 'jakarta',
      cityVisible: true,
      bio: 'Cari teman jalan dan nonton film.',
      interests: ['film', 'kuliner', 'pertemanan'],
    },
  },
];

for (const { email, password, profile } of PROFILES) {
  const signIn = await fetch(AUTH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!signIn.ok) {
    console.error(`Gagal masuk sebagai ${email}: ${signIn.status} ${await signIn.text()}`);
    process.exitCode = 1;
    continue;
  }
  const { idToken } = await signIn.json();

  const res = await fetch(`${API}/v1/me/profile`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
    body: JSON.stringify(profile),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Gagal menyimpan profil ${email}: ${res.status} ${body}`);
    process.exitCode = 1;
  } else {
    console.log(`Profil siap: ${email} -> ${profile.displayName} (${profile.cityId})`);
  }
}
