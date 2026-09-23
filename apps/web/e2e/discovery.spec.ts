import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import * as emu from '../../../services/api/test/emulator';
import { seedActivities } from '../../../services/api/test/seed-activities';

const API = 'http://127.0.0.1:18081';
const SHOTS = resolve(process.cwd(), '../../docs/design/screenshots');
mkdirSync(SHOTS, { recursive: true });
const PASSWORD = 'DiscoveryUji2026';

// Semua tes di file ini berbagi satu pengguna + satu set data yang diseed sekali di
// beforeAll. Serial (satu worker) mencegah Playwright menjalankan beforeAll lebih dari
// sekali (yang akan menggandakan data seed bila tersebar ke beberapa worker paralel).
test.describe.configure({ mode: 'serial' });

async function axeViolations(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

let userEmail: string;

test.beforeAll(async () => {
  test.setTimeout(30_000);
  const email = emu.uniqueEmail('disco');
  await emu.signUp(email, PASSWORD);
  const unverified = await emu.signIn(email, PASSWORD);
  await emu.requestVerification(unverified.idToken);
  await emu.applyVerification(await emu.latestOobCode(email, 'VERIFY_EMAIL'));
  const verified = await emu.signIn(email, PASSWORD);
  const profileRes = await fetch(`${API}/v1/me/profile`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${verified.idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Penjelajah',
      avatarId: 'cat',
      bio: '',
      cityId: 'jakarta',
      cityVisible: true,
      interests: ['ngopi'],
    }),
  });
  if (!profileRes.ok) throw new Error(`Gagal menyiapkan profil uji: HTTP ${profileRes.status}`);
  userEmail = email;

  const app = getApps()[0] ?? initializeApp({ projectId: 'demo-placetogo' });
  const db = getFirestore(app);
  await seedActivities(db, verified.localId);

  // Tambahan agar total ajakan aktif > 10 (ukuran halaman default), supaya "Muat lebih banyak" teruji.
  const batch = db.batch();
  const now = Date.now();
  for (let i = 0; i < 6; i++) {
    const ref = db.collection('activities').doc();
    batch.set(ref, {
      creatorId: verified.localId,
      title: `Ajakan tambahan ${i + 1}`,
      titleLower: `ajakan tambahan ${i + 1}`,
      categoryId: 'lainnya',
      cityId: 'jakarta',
      venueName: 'Lokasi contoh',
      capacity: 4,
      participantCount: 0,
      paymentType: 'split',
      status: 'published',
      // Jauh lebih lambat dari semua ajakan contoh (maks 120 jam) agar selalu berada di
      // ujung urutan "Rekomendasi" (startsAt naik) — tidak mengganggu pratinjau Beranda,
      // hanya muncul saat "Muat lebih banyak" diklik.
      startsAt: now + (500 + i) * 3_600_000,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
});

async function login(page: Page) {
  await page.goto('/masuk');
  await page.getByLabel('Email').fill(userEmail);
  await page.getByLabel('Kata sandi', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();
}

test.describe('Beranda', () => {
  test('menampilkan grid kategori dan pratinjau rekomendasi tanpa yang kedaluwarsa/draft', async ({ page }) => {
    await login(page);
    for (const label of ['Ngopi', 'Makan', 'Nonton', 'Jalan-jalan', 'Buku', 'Olahraga', 'Game', 'Lainnya']) {
      // exact: true — tanpa ini, nama bisa cocok sebagian dengan kartu ajakan yang nama
      // aksesibelnya kebetulan diawali label kategori yang sama (mis. "Olahraga Patungan Main...").
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByText('Ngopi santai sore di Tuku')).toBeVisible();
    await expect(page.getByText('Ngobrol kemarin (sudah lewat)')).toHaveCount(0);
    await expect(page.getByText('Rencana workshop seni gerabah (draft)')).toHaveCount(0);
    expect(await axeViolations(page)).toEqual([]);
    await page.screenshot({ path: resolve(SHOTS, 'discovery-beranda.png') });
  });

  test('klik kategori dari Beranda membawa ke Jelajah dengan filter aktif', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Buku', exact: true }).click();
    await expect(page).toHaveURL(/\/jelajah\?kategori=buku$/);
    await expect(page.getByText('Diskusi buku bulan ini')).toBeVisible();
    await expect(page.getByText('Ngopi santai sore di Tuku')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Buku', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('"Lihat semua" membawa ke Jelajah tanpa filter', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Lihat semua', exact: true }).click();
    await expect(page).toHaveURL(/\/jelajah$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Jelajah' })).toBeVisible();
  });
});

test.describe('Jelajah', () => {
  test('tab Rekomendasi: filter kategori dan kota di header mempersempit hasil', async ({ page }) => {
    await login(page);
    await page.goto('/jelajah');
    await expect(page.getByText('Ngopi santai sore di Tuku')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
    await page.screenshot({ path: resolve(SHOTS, 'discovery-jelajah.png') });

    // Kategori dipilih di dalam modal Filter (mockup layar 15), bukan dari chip di halaman.
    await page.getByRole('button', { name: /Semua Minat/ }).click();
    await page.getByRole('button', { name: 'Ngopi', exact: true }).click();
    await page.getByRole('button', { name: 'Terapkan' }).click();
    await expect(page.getByText('Ngopi santai sore di Tuku')).toBeVisible();
    await expect(page.getByText('Makan ramen bareng')).toHaveCount(0);

    await page.getByRole('button', { name: /Minat/ }).click();
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Terapkan' }).click();

    // Kota dipilih dari header, bukan dari kontrol di halaman Jelajah.
    await page.getByRole('button', { name: /^Kota aktif:/ }).click();
    await page.getByRole('button', { name: 'Bandung', exact: true }).click();
    await expect(page.getByText('Ngopi pagi produktif')).toBeVisible(); // Bandung
    await expect(page.getByText('Ngopi santai sore di Tuku')).toHaveCount(0); // Jakarta
  });

  async function applyRadius(page: Page, km: string) {
    await page.getByRole('button', { name: /Radius/ }).click();
    await page.locator('input[type="range"]').fill(km);
    await page.getByRole('button', { name: 'Terapkan' }).click();
  }

  test('filter radius: izin diberikan -> ajakan dekat muncul dengan jarak, kota jauh tidak', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -6.1754, longitude: 106.8272 }); // Monas, Jakarta
    await login(page);
    await page.goto('/jelajah');
    await applyRadius(page, '20');

    await expect(page.getByText('Ngopi santai sore di Tuku')).toBeVisible(); // ~2 km dari Monas
    await expect(page.getByText(/\d+([.,]\d+)?\s?(m|km)\b/).first()).toBeVisible(); // label jarak tampil
    await expect(page.getByText('Ngopi pagi produktif')).toHaveCount(0); // Bandung, di luar radius
    await expect(page.getByText('Nonton film indie')).toHaveCount(0); // Yogyakarta
    await expect(page.getByText('Ngobrol kemarin (sudah lewat)')).toHaveCount(0);
    await expect(page.getByText('Rencana workshop seni gerabah (draft)')).toHaveCount(0);
    expect(await axeViolations(page)).toEqual([]);
  });

  test('filter radius: izin ditolak -> pesan jelas dengan tombol coba lagi', async ({ page, context }) => {
    // Tanpa grantPermissions: browser menolak permintaan lokasi secara default di mode otomatis.
    await context.clearPermissions();
    await login(page);
    await page.goto('/jelajah');
    await applyRadius(page, '10');
    await expect(page.getByRole('heading', { name: 'Izin lokasi ditolak' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coba lagi' })).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });

  test('pencarian: mencocokkan awalan judul dan kosong menampilkan empty state', async ({ page }) => {
    await login(page);
    await page.goto('/jelajah');
    await page.getByLabel('Cari aktivitas').fill('Ngopi');
    await expect(page.getByText('Ngopi santai sore di Tuku')).toBeVisible();
    await expect(page.getByText('Makan ramen bareng')).toHaveCount(0);

    await page.getByLabel('Cari aktivitas').fill('katakuncitidakada');
    await expect(page.getByRole('heading', { name: 'Belum ada ajakan' })).toBeVisible();
    await expect(page.getByText('Tidak ada ajakan yang judulnya diawali kata itu.')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });

  test('"Muat lebih banyak" menambah hasil tanpa duplikat', async ({ page }) => {
    await login(page);
    await page.goto('/jelajah');
    const initialCount = await page.getByRole('link').filter({ has: page.locator('h3') }).count();
    expect(initialCount).toBeLessThanOrEqual(10);

    await page.getByRole('button', { name: 'Muat lebih banyak' }).click();
    await expect(page.getByText('Ajakan tambahan 6')).toBeVisible();
    const afterCount = await page.getByRole('link').filter({ has: page.locator('h3') }).count();
    expect(afterCount).toBeGreaterThan(initialCount);

    const titles = await page.locator('h3').allInnerTexts();
    expect(new Set(titles).size).toBe(titles.length); // tidak ada judul (kartu) yang dobel
  });
});

test.describe('Detail ajakan', () => {
  test('menampilkan info lengkap dari kartu Discovery', async ({ page }) => {
    await login(page);
    await page.goto('/jelajah');
    await page.getByText('Ngopi santai sore di Tuku').click();
    await expect(page).toHaveURL(/\/jelajah\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Ngopi santai sore di Tuku' })).toBeVisible();
    await expect(page.getByText('Tuku, Menteng, Jakarta')).toBeVisible();
    await expect(page.getByText('1/4 peserta')).toBeVisible();
    await expect(page.getByText('Patungan')).toBeVisible();
    await expect(page.getByText('Diajak oleh')).toBeVisible();
    await expect(page.getByText('Ngobrol santai sambil ngopi.', { exact: false })).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
    await page.screenshot({ path: resolve(SHOTS, 'discovery-detail.png') });

    await page.locator('#konten').getByRole('link', { name: 'Jelajah', exact: true }).click(); // tautan kembali, bukan nav bawah
    await expect(page).toHaveURL(/\/jelajah$/);
  });

  test('ajakan yang penuh menampilkan status penuh', async ({ page }) => {
    await login(page);
    await page.goto('/jelajah');
    await page.getByText('Ngopi pagi produktif').click();
    await expect(page.getByText('6/6 peserta (penuh)')).toBeVisible();
  });

  test('id tidak dikenal menampilkan "tidak ditemukan"', async ({ page }) => {
    await login(page);
    await page.goto('/jelajah/id-tidak-ada-sama-sekali');
    await expect(page.getByRole('heading', { name: 'Ajakan tidak ditemukan' })).toBeVisible();
  });
});
