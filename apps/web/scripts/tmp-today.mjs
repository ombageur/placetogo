import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, locale: 'id-ID' });
await ctx.grantPermissions(['geolocation']);
await ctx.setGeolocation({ latitude: -6.1754, longitude: 106.8272 });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/masuk', { waitUntil: 'domcontentloaded' });
await p.getByLabel('Email').fill('rahmansunandi.cloud@gmail.com');
await p.getByLabel('Kata sandi', { exact: true }).fill('AdminLokal2026');
await p.getByRole('button', { name: /masuk/i }).click();
await p.waitForTimeout(6000);
await p.goto('http://localhost:3000/jelajah', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);

const titles = async () => (await p.locator('a[href^="/jelajah/"] h3').allInnerTexts()).map((t) => t.trim());
const tabs = await p.locator('[role="tab"]').all();
console.log('chip tanggal:', (await Promise.all(tabs.slice(0, 4).map((t) => t.innerText()))).map((t) => t.replace(/\s+/g, ' ')).join(' | '));

for (const kota of ['Bandung', 'Surabaya']) {
  await p.getByRole('button', { name: /^Kota aktif:/ }).click();
  await p.waitForTimeout(700);
  await p.getByRole('button', { name: kota, exact: true }).click();
  await p.waitForTimeout(2800);
  const all = await titles();
  const tabsNow = await p.locator('[role="tab"]').all();
  await tabsNow[1].click(); // chip tanggal pertama = hari ini
  await p.waitForTimeout(1500);
  const today = await titles();
  await tabsNow[0].click(); // kembali ke Semua
  await p.waitForTimeout(1200);
  console.log(`${kota}: semua=${all.length} [${all.join(', ')}] | hari ini=${today.length} [${today.join(', ')}]`);
}
await b.close();
