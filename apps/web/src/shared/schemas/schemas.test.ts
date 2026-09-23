import { describe, expect, it } from 'vitest';
import { PAGINATION, pageQuerySchema } from '../index.js';

describe('pageQuerySchema', () => {
  it('memakai ukuran awal 10', () => {
    expect(pageQuerySchema.parse({}).limit).toBe(PAGINATION.defaultSize);
  });
  it('menolak ukuran di atas 20', () => {
    expect(pageQuerySchema.safeParse({ limit: 21 }).success).toBe(false);
  });
});

// publicUserSchema, avatarId/cityId/interests validation: lihat schemas/profile.test.ts
