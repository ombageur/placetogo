import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(import.meta.dirname, 'globals.css'), 'utf8');
const rootBlock = css.match(/:root\s*{([\s\S]*?)\n}/)?.[1] ?? '';

function token(name: string): string {
  const m = rootBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m?.[1]) throw new Error(`token --${name} tidak ditemukan`);
  return m[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('identitas visual', () => {
  it('memakai warna merek referensi', () => {
    expect(token('primary').toLowerCase()).toBe('#136548');
    expect(token('secondary').toLowerCase()).toBe('#28664f');
    expect(token('mint').toLowerCase()).toBe('#e9f5ee');
    expect(token('background').toLowerCase()).toBe('#ffffff');
  });
});

describe('kontras WCAG AA', () => {
  // [teks, latar, minimum]: 4.5 untuk teks biasa.
  const textPairs: Array<[string, string, string]> = [
    ['foreground', 'background', 'teks utama di putih'],
    ['primary', 'background', 'teks/heading hijau di putih'],
    ['secondary', 'background', 'teks hijau sekunder di putih'],
    ['primary-foreground', 'primary', 'tombol utama'],
    ['secondary-foreground', 'secondary', 'tombol sekunder gelap'],
    ['primary', 'mint', 'teks hijau di mint'],
    ['foreground', 'mint', 'teks utama di mint'],
    ['muted-foreground', 'background', 'teks redup di putih'],
    ['muted-foreground', 'mint', 'teks redup di mint'],
    ['danger-foreground', 'danger', 'tombol bahaya'],
    ['danger', 'background', 'pesan galat di putih'],
    ['danger-soft-foreground', 'danger-soft', 'badge bahaya'],
    ['warning-soft-foreground', 'warning-soft', 'badge peringatan'],
    ['info-soft-foreground', 'info-soft', 'badge info'],
    ['neutral-soft-foreground', 'neutral-soft', 'badge netral'],
    ['success-soft-foreground', 'success-soft', 'badge sukses'],
    ['success', 'background', 'teks sukses di putih'],
    ['success-foreground', 'success', 'tombol sukses'],
    ['foreground', 'surface', 'teks utama di kanvas halaman'],
    ['muted-foreground', 'surface', 'teks redup di kanvas halaman'],
    ['primary', 'surface', 'teks hijau di kanvas halaman'],
    ['foreground', 'muted', 'teks utama di blok redup'],
    ['muted-foreground', 'muted', 'teks redup di blok redup'],
    ['foreground', 'card', 'teks utama di kartu'],
    ['foreground', 'mint-soft', 'teks utama di mint paling muda'],
    ['primary-foreground', 'primary-strong', 'permukaan hijau pekat'],
  ];
  for (const [fg, bg, label] of textPairs) {
    it(`${label} >= 4.5:1`, () => {
      expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('batas input >= 3:1 terhadap putih (WCAG 1.4.11)', () => {
    expect(contrast(token('border-strong'), token('background'))).toBeGreaterThanOrEqual(3);
  });

  /*
   * Bukan 3:1 seperti WCAG 1.4.11, karena tepi kartu bukan pembatas esensial: kartu juga
   * dibedakan oleh warna isian dan bayangannya. Ambang ini hanya menjaga agar garisnya tidak
   * ikut hilang ketika kanvas halaman diberi nuansa.
   */
  it('batas kartu tetap terbaca di atas kanvas halaman', () => {
    expect(contrast(token('border'), token('surface'))).toBeGreaterThanOrEqual(1.4);
  });
});

describe('lapisan permukaan', () => {
  it('kartu lebih terang daripada kanvas halaman', () => {
    expect(luminance(token('card'))).toBeGreaterThan(luminance(token('surface')));
  });

  it('kanvas halaman tetap sangat terang agar identitas putih terjaga', () => {
    expect(luminance(token('surface'))).toBeGreaterThan(0.9);
  });

  it('mint bertingkat dari paling muda ke paling pekat', () => {
    const steps = ['mint-soft', 'mint', 'mint-strong'].map((name) => luminance(token(name)));
    expect(steps[0]).toBeGreaterThan(steps[1]!);
    expect(steps[1]).toBeGreaterThan(steps[2]!);
  });
});
