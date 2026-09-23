/**
 * Sapuan UI terhadap server pengembangan yang sedang berjalan (bukan pengganti `pnpm test:e2e`).
 *
 * Memeriksa tiap rute pada empat viewport: pelanggaran axe (WCAG 2.0/2.1 A + AA), target sentuh
 * di bawah 44px, dan scroll horizontal. Dipakai ketika suite E2E tidak boleh dijalankan karena
 * akan menghentikan emulator Firebase yang sedang dipakai.
 *
 * Prasyarat: emulator hidup, API di 8081, web di http://localhost:3000, akun demo sudah di-seed.
 * Jalankan: node scripts/audit-ui.mjs
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const BASE = 'http://localhost:3000';
const ROUTES = [['/', 'Beranda'], ['/jelajah', 'Jelajah'], ['/buat', 'Buat Ajakan'], ['/chat', 'Chat'], ['/profil', 'Profil'], ['/design-system', 'Sistem Desain']];

const b = await chromium.launch();
for (const [w, h] of [[375, 812], [430, 932], [768, 1024], [1280, 800]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 768,
    permissions: ['geolocation'], geolocation: { latitude: -6.1754, longitude: 106.8272 }, locale: 'id-ID' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/masuk', { waitUntil: 'domcontentloaded' });
  await p.getByLabel('Email').fill('admin@placetogo.test');
  await p.getByLabel('Kata sandi', { exact: true }).fill('DemoAdmin2026');
  await p.getByRole('button', { name: /masuk/i }).click();
  await p.waitForTimeout(4000);
  for (const [route, h1] of ROUTES) {
    await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    await p.getByRole('heading', { level: 1, name: h1 }).first().waitFor({ timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(1200);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const small = await p.evaluate(() => {
      const els = document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea');
      return [...els].filter((el) => el.offsetParent !== null && !el.closest('.sr-only') && !el.matches('.sr-only'))
        .map((el) => { const r = el.getBoundingClientRect();
          return { t: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 22), w: Math.round(r.width), h: Math.round(r.height) }; })
        .filter((r) => r.w > 0 && (r.h < 44 || r.w < 44));
    });
    const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    const ok = small.length === 0 && overflow <= 0 && axe.violations.length === 0;
    console.log(`${String(w).padStart(4)}px ${route.padEnd(15)} ${ok ? 'OK' : 'PERIKSA'}  overflow=${overflow} small=${small.length ? JSON.stringify(small) : '0'} axe=${axe.violations.length ? axe.violations.map(v=>v.id).join(',') : '0'}`);
  }
  await ctx.close();
}
await b.close();
