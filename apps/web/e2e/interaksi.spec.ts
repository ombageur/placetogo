import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const SHOTS = resolve(process.cwd(), '../../docs/design/screenshots');
mkdirSync(SHOTS, { recursive: true });

test('keyboard: tautan lewati-ke-konten adalah fokus pertama dan berfungsi', async ({ page }) => {
  await page.goto('/jelajah');
  // Shell privat baru dirender setelah sesi terverifikasi.
  await expect(page.getByRole('heading', { level: 1, name: 'Jelajah' })).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Lewati ke konten' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#konten')).toBeFocused();
});

test('keyboard: semua item navigasi dapat dijangkau dengan Tab dan punya indikator fokus', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Beranda' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' }).filter({ visible: true });
  const links = nav.getByRole('link');
  const count = await links.count();
  const reached = new Set<string>();
  // 40: cukup untuk melewati skip-link, logo, grid kategori, dan kartu pratinjau Discovery
  // di Beranda sebelum mencapai nav bawah (bukan batas ketat, hanya jaga-jaga anti hang).
  for (let i = 0; i < 40 && reached.size < count; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { label: el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '', outline: cs.outlineStyle, width: cs.outlineWidth, inNav: !!el.closest('nav') };
    });
    if (focused?.inNav) {
      reached.add(focused.label);
      expect(focused.outline, `outline untuk ${focused.label}`).not.toBe('none');
      expect(parseFloat(focused.width)).toBeGreaterThanOrEqual(2);
    }
  }
  // Semua tautan nav (termasuk tautan logo pada sidebar) dapat difokus.
  expect(reached.size).toBeGreaterThanOrEqual(5);
});

test('modal: fokus terjebak, Esc menutup, fokus kembali ke pemicu', async ({ page }) => {
  await page.goto('/design-system');
  const trigger = page.getByRole('button', { name: 'Buka modal' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Contoh modal' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(/Fokus terkunci/);
  await page.screenshot({ path: resolve(SHOTS, `${test.info().project.name}-modal-terbuka.png`) });

  // Dialog native: fokus boleh keluar ke UI browser (body), tetapi tidak pernah mendarat di latar.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const where = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return "browser";
      return el.closest("dialog") ? "dialog" : "latar";
    });
    expect(where).not.toBe("latar");
  }
  // Latar inert: elemen di luar dialog tidak dapat menerima fokus.
  const bgFocusable = await page.evaluate(() => {
    const link = document.querySelector("nav a") as HTMLElement;
    link.focus();
    return document.activeElement === link;
  });
  expect(bgFocusable).toBe(false);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('modal: tombol Tutup dan klik backdrop menutup', async ({ page }) => {
  await page.goto('/design-system');
  await page.getByRole('button', { name: 'Buka modal' }).click();
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByRole('button', { name: 'Buka modal' }).click();
  await page.mouse.click(2, 2); // area backdrop di luar panel
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('toast: diumumkan lewat role status dan dapat ditutup', async ({ page }) => {
  await page.goto('/design-system');
  await page.getByRole('button', { name: 'Tampilkan toast' }).click();
  const toast = page.getByRole('status').filter({ hasText: 'Tersimpan' });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Tutup notifikasi' }).click();
  await expect(toast).toBeHidden();
});

test('input: label, petunjuk, dan galat terhubung via ARIA', async ({ page }) => {
  await page.goto('/design-system');
  const email = page.getByLabel('Email');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription('Format email tidak valid.');
  await expect(page.getByLabel('Nama panggilan')).toHaveAccessibleDescription('Tampil di profil publik.');
});

test('prefers-reduced-motion: animasi pemuat dimatikan', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/design-system');
  await expect(page.getByRole('heading', { level: 1, name: 'Sistem Desain' })).toBeVisible();
  const name = await page.evaluate(() => {
    const el = document.querySelector('[aria-hidden="true"].bg-mint-strong');
    return el ? getComputedStyle(el).animationName : 'tidak-ditemukan';
  });
  expect(name).toBe('none');
});
