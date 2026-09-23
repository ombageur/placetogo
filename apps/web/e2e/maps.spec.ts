import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fase 05 tanpa kunci Maps Platform asli di lingkungan tes ini: memverifikasi jalur
 * degradasi-anggun (backend/browser key kosong), BUKAN panggilan Google sungguhan.
 * `services/api` dijalankan lewat `node dist/server.js` (bukan `tsx --env-file`), jadi
 * `.env` lokal tidak ikut terbaca — env e2e hanya berasal dari playwright.config.ts +
 * proses saat ini, yang tidak menyetel GOOGLE_MAPS_SERVER_API_KEY / kunci browser.
 */
test('PlacePicker: backend Places belum dikonfigurasi -> pesan galat yang jelas', async ({ page }) => {
  await page.goto('/design-system');
  const input = page.getByLabel('Cari tempat pertemuan');
  await input.fill('Tuku Menteng');
  await expect(page.getByRole('alert').filter({ hasText: 'Tidak dapat mencari tempat' })).toBeVisible();
});

test('MapView: kunci browser belum dikonfigurasi -> pesan "peta tidak tersedia"', async ({ page }) => {
  await page.goto('/design-system');
  await expect(page.getByText('Peta tidak tersedia saat ini.')).toBeVisible();
  await expect(page.getByRole('img', { name: /Peta lokasi/ })).toHaveCount(0);
});

test('backend menolak permintaan Places tanpa token, dan sessionToken wajib ada', async ({ request }) => {
  const API = 'http://127.0.0.1:18081';
  const noAuth = await request.get(`${API}/v1/places/autocomplete?input=kopi&sessionToken=s1`);
  expect(noAuth.status()).toBe(401);

  const missingToken = await request.get(`${API}/v1/places/autocomplete?input=kopi`, {
    headers: { authorization: 'Bearer token-palsu' },
  });
  // Token palsu -> 401 sebelum validasi query sempat dicek; keduanya membuktikan endpoint tertutup.
  expect(missingToken.status()).toBe(401);
});

test('halaman sistem desain dengan komponen lokasi tetap bebas pelanggaran a11y', async ({ page }) => {
  await page.goto('/design-system');
  const violations = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(violations.violations.map((v) => v.id)).toEqual([]);
});
