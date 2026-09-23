import { describe, expect, it } from 'vitest';
import { withoutUndefined } from './firestore-data.js';

describe('withoutUndefined', () => {
  it('membuang kunci yang bernilai undefined', () => {
    const out = withoutUndefined({ a: 1, b: undefined, c: 'x' });
    expect(Object.keys(out).sort()).toEqual(['a', 'c']);
    expect('b' in out).toBe(false);
  });

  it('mempertahankan null, nol, string kosong, dan false', () => {
    const out = withoutUndefined({ a: null, b: 0, c: '', d: false });
    expect(out).toEqual({ a: null, b: 0, c: '', d: false });
  });

  it('tidak mengubah objek aslinya', () => {
    const input = { a: 1, b: undefined };
    withoutUndefined(input);
    expect('b' in input).toBe(true);
  });

  it('mengembalikan objek kosong bila semua nilainya undefined', () => {
    expect(withoutUndefined({ a: undefined, b: undefined })).toEqual({});
  });
});
