import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import * as emu from '../../../services/api/test/emulator';

const API = 'http://127.0.0.1:18081';
const SHOTS = resolve(process.cwd(), '../../docs/design/screenshots');
mkdirSync(SHOTS, { recursive: true });

const PASSWORD = 'KopiSenja2026';
const TEST_PROFILE = {
  displayName: 'KopiSenja',
  avatarId: 'cat',
  bio: 'Suka ngopi dan baca buku.',
  cityId: 'jakarta',
  cityVisible: true,
  interests: ['ngopi', 'buku'],
};

async function verifyEmail(email: string) {
  const s = await emu.signIn(email, PASSWORD);
  await emu.requestVerification(s.idToken);
  await emu.applyVerification(await emu.latestOobCode(email, 'VERIFY_EMAIL'));
  return emu.signIn(email, PASSWORD); // token baru membawa klaim email_verified terbaru
}

async function completeProfile(idToken: string, overrides: Partial<typeof TEST_PROFILE> = {}) {
  const res = await fetch(`${API}/v1/me/profile`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ ...TEST_PROFILE, ...overrides }),
  });
  if (!res.ok) throw new Error(`Gagal melengkapi profil uji: HTTP ${res.status}`);
}

/**
 * Membuat akun lewat emulator (bukan UI) agar uji fokus pada alur yang diuji.
 * `ready: true` = email terverifikasi DAN profil lengkap (stage 'ready').
 * `ready: false` = baru daftar, belum verifikasi (stage 'verify_email').
 */
async function createUser({ ready }: { ready: boolean }) {
  const email = emu.uniqueEmail(ready ? 'ok' : 'new');
  await emu.signUp(email, PASSWORD);
  if (ready) {
    const s = await verifyEmail(email);
    await completeProfile(s.idToken);
  }
  return email;
}

async function markIntroSeen(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem('ptg:intro-seen', '1'));
}

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/masuk');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
}

async function axeViolations(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('pengenalan (onboarding empat layar)', () => {
  test('pengunjung baru diarahkan ke pengenalan, melewati 4 layar, lalu ke daftar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/mulai$/);

    const titles = [
      'Temukan teman, temukan tempat.',
      'Kenalan tanpa tekanan.',
      'Bertemu karena ada tujuan.',
      'Aman dan nyaman.',
    ];
    for (const [i, title] of titles.entries()) {
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('region', { name: `Langkah ${i + 1} dari 4` })).toBeVisible();
      if (i === 0) {
        expect(await axeViolations(page)).toEqual([]);
        await page.screenshot({ path: resolve(SHOTS, 'auth-mulai-1.png') });
      }
      if (i === 3) {
        expect(await axeViolations(page)).toEqual([]);
        await page.screenshot({ path: resolve(SHOTS, 'auth-mulai-4.png') });
        await page.getByRole('button', { name: 'Mulai Sekarang' }).click();
      } else {
        await page.getByRole('button', { name: i === 0 ? 'Mulai' : 'Lanjut', exact: true }).click();
      }
    }
    await expect(page).toHaveURL(/\/daftar$/);

    // Sudah melihat pengenalan: rute privat kini mengarah ke Masuk.
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/masuk$/);
  });

  test('Lewati langsung ke halaman daftar', async ({ page }) => {
    await page.goto('/mulai');
    await page.getByRole('button', { name: 'Lewati' }).click();
    await expect(page).toHaveURL(/\/daftar$/);
  });
});

test.describe('rute privat menolak pengguna tidak login', () => {
  for (const path of ['/', '/jelajah', '/buat', '/chat', '/profil', '/profil/edit', '/lengkapi-profil', '/design-system', '/verifikasi-email']) {
    test(`${path} -> dialihkan ke halaman masuk/pengenalan tanpa menampilkan konten`, async ({ page }) => {
      await markIntroSeen(page);
      await page.goto(path);
      await expect(page).toHaveURL(/\/masuk$/);
      await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toHaveCount(0);
      await expect(page.getByText('Segera hadir')).toHaveCount(0);
    });
  }
});

test.describe('daftar', () => {
  test('validasi sisi klien: email tidak valid dan kata sandi lemah', async ({ page }) => {
    await page.goto('/daftar');
    await page.getByRole('button', { name: 'Daftar', exact: true }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Format email tidak valid.');
    await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAccessibleDescription(/minimal 8 karakter/i);

    await page.getByLabel('Email').fill('a@b.co');
    await page.getByLabel('Kata sandi', { exact: true }).fill('hurufsajaa');
    await page.getByRole('button', { name: 'Daftar', exact: true }).click();
    await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAccessibleDescription('Kata sandi harus berisi huruf dan angka.');
    expect(await axeViolations(page)).toEqual([]);
    await page.screenshot({ path: resolve(SHOTS, 'auth-daftar-galat.png') });
  });

  test('tombol tampilkan/sembunyikan kata sandi', async ({ page }) => {
    await page.goto('/daftar');
    const field = page.getByLabel('Kata sandi', { exact: true });
    await expect(field).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Tampilkan kata sandi' }).click();
    await expect(field).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Sembunyikan kata sandi' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('registrasi -> verifikasi email -> lengkapi profil -> beranda', async ({ page, request }) => {
    const email = emu.uniqueEmail('reg');
    await page.goto('/daftar');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Kata sandi', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Daftar', exact: true }).click();

    // Belum terverifikasi: diarahkan ke halaman verifikasi.
    await expect(page).toHaveURL(/\/verifikasi-email$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Verifikasi email kamu' })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
    await page.screenshot({ path: resolve(SHOTS, 'auth-verifikasi-email.png') });

    // Rute privat lain tetap tertutup sebelum verifikasi.
    await page.goto('/profil');
    await expect(page).toHaveURL(/\/verifikasi-email$/);

    // Backend melihat akun terinisialisasi dan tahap verify_email.
    const before = await emu.signIn(email, PASSWORD);
    const me = await request.get(`${API}/v1/me`, { headers: { authorization: `Bearer ${before.idToken}` } });
    expect(await me.json()).toMatchObject({ emailVerified: false, initialized: true, stage: 'verify_email' });
    expect((await request.get(`${API}/v1/verified/ping`, { headers: { authorization: `Bearer ${before.idToken}` } })).status()).toBe(403);

    // "Saya sudah verifikasi" sebelum benar-benar verifikasi: tetap di halaman, ada pesan.
    await page.getByRole('button', { name: 'Saya sudah verifikasi' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'belum terverifikasi' })).toBeVisible();

    // Buka tautan di email (lewat emulator), lalu konfirmasi -> diarahkan melengkapi profil.
    await emu.applyVerification(await emu.latestOobCode(email, 'VERIFY_EMAIL'));
    await page.getByRole('button', { name: 'Saya sudah verifikasi' }).click();
    await expect(page).toHaveURL(/\/lengkapi-profil$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Lengkapi profil' })).toBeVisible();

    const afterVerify = await emu.signIn(email, PASSWORD);
    expect(
      (await (await request.get(`${API}/v1/me`, { headers: { authorization: `Bearer ${afterVerify.idToken}` } })).json()),
    ).toMatchObject({ emailVerified: true, stage: 'profile_incomplete' });

    // Rute utama tetap tertutup selama profil belum lengkap.
    await page.goto('/');
    await expect(page).toHaveURL(/\/lengkapi-profil$/);

    // Isi formulir profil: avatar, nama, bio, kota, minat.
    await page.getByRole('radio', { name: 'Kucing' }).click();
    await page.getByLabel('Nama panggilan').fill('KopiSenja');
    await page.getByLabel('Tentang saya').fill('Suka ngopi dan baca buku.');
    await page.getByLabel('Kota').selectOption('jakarta');
    await page.getByRole('button', { name: 'Ngopi', exact: true }).click();
    await page.getByRole('button', { name: 'Buku', exact: true }).click();
    expect(await axeViolations(page)).toEqual([]);
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();

    // Profil tersimpan benar dan terlihat di halaman Profil.
    await page.goto('/profil');
    await expect(page.getByText('KopiSenja', { exact: true })).toBeVisible();
    await expect(page.getByText('Suka ngopi dan baca buku.')).toBeVisible();
    await expect(page.getByText('Jakarta')).toBeVisible();
    await expect(page.getByText('Ngopi', { exact: true })).toBeVisible();

    const ready = await emu.signIn(email, PASSWORD);
    const final = await request.get(`${API}/v1/me`, { headers: { authorization: `Bearer ${ready.idToken}` } });
    expect(await final.json()).toMatchObject({ stage: 'ready', profileComplete: true });
  });

  test('email yang sudah terdaftar: pesan netral tanpa detail SDK', async ({ page }) => {
    const email = await createUser({ ready: false });
    await page.goto('/daftar');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Kata sandi', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Daftar', exact: true }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'tidak dapat dipakai' });
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText('auth/');
  });
});

test.describe('masuk', () => {
  test('pesan galat sama untuk email tidak terdaftar dan kata sandi salah; masuk benar berhasil', async ({ page }) => {
    const email = await createUser({ ready: true });

    await login(page, email, 'SalahSekali99');
    const wrong = page.getByRole('alert').filter({ hasText: 'salah' });
    await expect(wrong).toBeVisible();
    const wrongText = await wrong.innerText();

    await login(page, emu.uniqueEmail('tidakada'), 'SalahSekali99');
    const unknown = page.getByRole('alert').filter({ hasText: 'salah' });
    await expect(unknown).toBeVisible();
    expect(await unknown.innerText()).toBe(wrongText);
    expect(wrongText).toBe('Email atau kata sandi salah.');

    await login(page, email);
    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();
  });

  test('validasi: kolom kosong; a11y halaman masuk; Google tersembunyi bila belum dikonfigurasi', async ({ page }) => {
    await page.goto('/masuk');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Format email tidak valid.');
    await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAccessibleDescription('Kata sandi wajib diisi.');
    await expect(page.getByRole('button', { name: /Google/ })).toHaveCount(0);
    expect(await axeViolations(page)).toEqual([]);
    await page.screenshot({ path: resolve(SHOTS, 'auth-masuk.png') });
  });

  test('kata sandi tidak muncul di URL maupun localStorage/sessionStorage', async ({ page }) => {
    const email = await createUser({ ready: true });
    await login(page, email);
    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();
    expect(page.url()).not.toContain(PASSWORD);
    const stores = await page.evaluate(() => JSON.stringify({ l: { ...localStorage }, s: { ...sessionStorage } }));
    expect(stores).not.toContain(PASSWORD);
  });
});

test.describe('reset kata sandi', () => {
  test('respons sama untuk email terdaftar dan tidak; tautan reset mengganti kata sandi', async ({ page }) => {
    const email = await createUser({ ready: true });
    await page.goto('/lupa-password');

    await page.getByLabel('Email').fill('salah-format');
    await page.getByRole('button', { name: 'Kirim tautan' }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Format email tidak valid.');
    expect(await axeViolations(page)).toEqual([]);

    await page.getByLabel('Email').fill(emu.uniqueEmail('tidakada'));
    await page.getByRole('button', { name: 'Kirim tautan' }).click();
    const notice = page.getByRole('status').filter({ hasText: 'Jika email tersebut terdaftar' });
    await expect(notice).toBeVisible();
    const unknownText = await notice.innerText();

    await page.goto('/lupa-password');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Kirim tautan' }).click();
    const notice2 = page.getByRole('status').filter({ hasText: 'Jika email tersebut terdaftar' });
    await expect(notice2).toBeVisible();
    expect(await notice2.innerText()).toBe(unknownText);
    // Cooldown kirim ulang aktif.
    await expect(page.getByRole('button', { name: /Kirim ulang dalam \d+ dtk/ })).toBeDisabled();
    await page.screenshot({ path: resolve(SHOTS, 'auth-lupa-password.png') });

    // Buka tautan reset (lewat emulator) dan atur kata sandi baru.
    await emu.applyPasswordReset(await emu.latestOobCode(email, 'PASSWORD_RESET'), 'KataSandiBaru77');
    await login(page, email, PASSWORD);
    await expect(page.getByRole('alert').filter({ hasText: 'Email atau kata sandi salah.' })).toBeVisible();
    await login(page, email, 'KataSandiBaru77');
    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();
  });
});

test.describe('keluar dan sesi', () => {
  test('keluar mengakhiri sesi: rute privat tertutup lagi, termasuk setelah muat ulang', async ({ page }) => {
    const email = await createUser({ ready: true });
    await markIntroSeen(page);
    await login(page, email);
    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();

    // Sesi bertahan saat muat ulang.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();

    await page.goto('/profil');
    await expect(page.getByTestId('account-email')).toHaveText(email);
    await page.getByRole('button', { name: 'Keluar' }).click();
    await expect(page).toHaveURL(/\/masuk$/);

    await page.goto('/profil');
    await expect(page).toHaveURL(/\/masuk$/);
    await page.reload();
    await expect(page).toHaveURL(/\/masuk$/);
  });

  test('pengguna siap pakai yang membuka /masuk dialihkan ke beranda', async ({ page }) => {
    const email = await createUser({ ready: true });
    await login(page, email);
    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();
    await page.goto('/masuk');
    await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();
  });
});

test.describe('backend menolak token tidak sah', () => {
  test('token palsu, kosong, dan skema salah -> 401 seragam', async ({ request }) => {
    const fake = await request.get(`${API}/v1/me`, { headers: { authorization: 'Bearer token.palsu.sekali' } });
    const none = await request.get(`${API}/v1/me`);
    const basic = await request.get(`${API}/v1/me`, { headers: { authorization: 'Basic abc' } });
    expect([fake.status(), none.status(), basic.status()]).toEqual([401, 401, 401]);
    expect(await fake.json()).toEqual(await none.json());
    expect((await request.post(`${API}/v1/me/init`, { headers: { authorization: 'Bearer palsu' } })).status()).toBe(401);
  });
});
