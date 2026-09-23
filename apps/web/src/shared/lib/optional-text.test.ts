import { describe, expect, it } from 'vitest';
import { emptyToUndefined } from './optional-text.js';

describe('emptyToUndefined', () => {
  it('mengubah string kosong dan hanya-spasi menjadi undefined', () => {
    expect(emptyToUndefined('')).toBeUndefined();
    expect(emptyToUndefined('   ')).toBeUndefined();
    expect(emptyToUndefined('\n\t ')).toBeUndefined();
  });
  it('membiarkan string berisi apa adanya (tidak memangkas)', () => {
    expect(emptyToUndefined('  halo  ')).toBe('  halo  ');
  });
  it('membiarkan nilai bukan-string apa adanya', () => {
    expect(emptyToUndefined(undefined)).toBeUndefined();
    expect(emptyToUndefined(null)).toBeNull();
    expect(emptyToUndefined(42)).toBe(42);
  });
});
