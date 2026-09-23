import { describe, expect, it } from 'vitest';
import { isActive, NAV_ITEMS } from './nav-items';

describe('NAV_ITEMS', () => {
  it('memiliki lima tujuan sesuai referensi', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['Beranda', 'Jelajah', 'Buat', 'Chat', 'Profil']);
  });
  it('href unik', () => {
    expect(new Set(NAV_ITEMS.map((i) => i.href)).size).toBe(NAV_ITEMS.length);
  });
});

describe('isActive', () => {
  it('Beranda hanya aktif di "/"', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/jelajah', '/')).toBe(false);
  });
  it('rute aktif untuk turunannya, bukan awalan kebetulan', () => {
    expect(isActive('/jelajah', '/jelajah')).toBe(true);
    expect(isActive('/jelajah/kopi', '/jelajah')).toBe(true);
    expect(isActive('/jelajahan', '/jelajah')).toBe(false);
  });
});
