import { expect, test as setup } from '@playwright/test';
import * as emu from '../../../services/api/test/emulator';
import { AUTH_FILE } from '../playwright.config';

const API = 'http://127.0.0.1:18081';

const TEST_PROFILE = {
  displayName: 'Pengguna Uji',
  avatarId: 'cat',
  bio: '',
  cityId: 'jakarta',
  cityVisible: true,
  interests: ['ngopi'],
};

/**
 * Membuat satu pengguna dengan email terverifikasi DAN profil lengkap (stage 'ready') di
 * Auth + Firestore Emulator, masuk lewat UI sungguhan, lalu menyimpan sesi (termasuk
 * IndexedDB Firebase) untuk dipakai proyek uji berikutnya (regresi navigasi/a11y Fase 01).
 */
setup('masuk sebagai pengguna siap pakai (terverifikasi + profil lengkap) dan simpan sesi', async ({ page }) => {
  const email = emu.uniqueEmail('setup');
  const password = 'SesiUjiE2E2026';
  await emu.signUp(email, password);
  const unverified = await emu.signIn(email, password);
  await emu.requestVerification(unverified.idToken);
  await emu.applyVerification(await emu.latestOobCode(email, 'VERIFY_EMAIL'));
  const verified = await emu.signIn(email, password); // token baru membawa email_verified=true

  const res = await fetch(`${API}/v1/me/profile`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${verified.idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify(TEST_PROFILE),
  });
  if (!res.ok) throw new Error(`Gagal menyiapkan profil uji: HTTP ${res.status}`);

  await page.goto('/masuk');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE, indexedDB: true });
});
