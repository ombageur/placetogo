import { describe, expect, it } from 'vitest';
import { createSessionToken } from './session-token';

describe('createSessionToken', () => {
  it('menghasilkan string tidak kosong', () => {
    const token = createSessionToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
  it('setiap panggilan menghasilkan token yang berbeda', () => {
    const a = createSessionToken();
    const b = createSessionToken();
    expect(a).not.toBe(b);
  });
});
