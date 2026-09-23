import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SHOTS = resolve(process.cwd(), '../../docs/design/screenshots');
mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  { path: '/', h1: 'Beranda', slug: 'beranda' },
  { path: '/jelajah', h1: 'Jelajah', slug: 'jelajah' },
  { path: '/buat', h1: 'Buat Ajakan', slug: 'buat' },
  { path: '/chat', h1: 'Chat', slug: 'chat' },
  { path: '/profil', h1: 'Profil', slug: 'profil' },
  { path: '/design-system', h1: 'Sistem Desain', slug: 'design-system' },
];

for (const route of ROUTES) {
  test(`rute ${route.path}: tampil, tanpa galat, tanpa overflow, a11y, target sentuh`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    const res = await page.goto(route.path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: route.h1 })).toBeVisible();

    // Tanpa scroll horizontal pada lebar ini.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'scroll horizontal').toBeLessThanOrEqual(0);

    // Navigasi: bawah pada < 768px, samping pada >= 768px; tepat satu yang terlihat.
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    await expect(nav.filter({ visible: true })).toHaveCount(1);
    const box = await nav.filter({ visible: true }).boundingBox();
    const width = page.viewportSize()!.width;
    if (width < 768) expect(box!.y + box!.height).toBeGreaterThan(page.viewportSize()!.height - 2);
    else expect(box!.x).toBeLessThanOrEqual(1);

    // Target sentuh interaktif >= 44px (WCAG 2.5.5 / pedoman referensi).
    const small = await page.evaluate(() => {
      const els = document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea');
      return [...els]
        .filter((el) => el.offsetParent !== null && !el.closest('.sr-only') && !el.matches('.sr-only'))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { text: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30), w: r.width, h: r.height };
        })
        .filter((r) => r.w > 0 && (r.h < 44 || r.w < 44));
    });
    expect(small, 'target < 44px').toEqual([]);

    // a11y otomatis (axe): WCAG 2.0/2.1 A + AA.
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);

    expect(errors).toEqual([]);

    await page.screenshot({ path: resolve(SHOTS, `${info.project.name}-${route.slug}.png`), fullPage: true });
  });
}

test('navigasi antar-rute lewat menu utama, aria-current mengikuti halaman', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' }).filter({ visible: true });
  for (const [label, h1] of [
    ['Jelajah', 'Jelajah'],
    ['Buat', 'Buat Ajakan'],
    ['Chat', 'Chat'],
    ['Profil', 'Profil'],
    ['Beranda', 'Beranda'],
  ] as const) {
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  }
});

test('halaman tidak dikenal menampilkan status 404 yang ramah', async ({ page }) => {
  const res = await page.goto('/tidak-ada');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kembali ke Beranda' })).toBeVisible();
});

test('manifest PWA dan ikon tersedia', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const json = await manifest.json();
  expect(json).toMatchObject({ short_name: 'placetogo', display: 'standalone', theme_color: '#174D3B', lang: 'id' });
  expect((await request.get('/icon.svg')).status()).toBe(200);
});
