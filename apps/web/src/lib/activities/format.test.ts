import { describe, expect, it } from 'vitest';
import { formatDistanceKm } from './format';

describe('formatDistanceKm', () => {
  it('di bawah 1 km ditampilkan dalam meter, dibulatkan', () => {
    expect(formatDistanceKm(0.85)).toBe('850 m');
    expect(formatDistanceKm(0.001)).toBe('1 m');
  });
  it('1 km ke atas ditampilkan dalam km, koma Indonesia, maksimal 1 desimal', () => {
    expect(formatDistanceKm(1)).toBe('1 km');
    expect(formatDistanceKm(3.24)).toBe('3,2 km');
    expect(formatDistanceKm(12)).toBe('12 km');
  });
});
