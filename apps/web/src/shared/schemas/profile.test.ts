import { describe, expect, it } from 'vitest';
import { AVATAR_CATALOG, CITY_CATALOG, INTEREST_CATALOG } from '../constants/catalog.js';
import { profileInputSchema } from './profile.js';

const valid = {
  displayName: 'KopiSenja',
  avatarId: 'cat',
  bio: 'Suka ngopi dan baca buku.',
  cityId: 'jakarta',
  cityVisible: true,
  interests: ['ngopi', 'buku'],
};

describe('katalog', () => {
  it('avatar minimal 12 pilihan', () => {
    expect(AVATAR_CATALOG.length).toBeGreaterThanOrEqual(12);
  });
  it('id katalog unik', () => {
    for (const list of [AVATAR_CATALOG, CITY_CATALOG, INTEREST_CATALOG]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    }
  });
});

describe('profileInputSchema', () => {
  it('menerima input valid', () => {
    expect(profileInputSchema.safeParse(valid).success).toBe(true);
  });

  it('memangkas dan membatasi nama panggilan', () => {
    const parsed = profileInputSchema.parse({ ...valid, displayName: '  KopiSenja  ' });
    expect(parsed.displayName).toBe('KopiSenja');
    expect(profileInputSchema.safeParse({ ...valid, displayName: 'A' }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, displayName: 'A'.repeat(41) }).success).toBe(false);
  });

  it('bio kosong atau hanya spasi menjadi undefined, bio > 100 karakter ditolak', () => {
    expect(profileInputSchema.parse({ ...valid, bio: '' }).bio).toBeUndefined();
    expect(profileInputSchema.parse({ ...valid, bio: '   ' }).bio).toBeUndefined();
    expect(profileInputSchema.safeParse({ ...valid, bio: 'a'.repeat(101) }).success).toBe(false);
  });

  it('menolak avatarId dan cityId di luar katalog', () => {
    expect(profileInputSchema.safeParse({ ...valid, avatarId: 'naga' }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, cityId: 'atlantis' }).success).toBe(false);
  });

  it('minat: minimal 1, maksimal 8, tanpa duplikat, hanya dari katalog', () => {
    expect(profileInputSchema.safeParse({ ...valid, interests: [] }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, interests: ['ngopi', 'ngopi'] }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, interests: ['ngawur'] }).success).toBe(false);
    const nine = INTEREST_CATALOG.slice(0, 9).map((i) => i.id);
    expect(profileInputSchema.safeParse({ ...valid, interests: nine }).success).toBe(false);
    const eight = INTEREST_CATALOG.slice(0, 8).map((i) => i.id);
    expect(profileInputSchema.safeParse({ ...valid, interests: eight }).success).toBe(true);
  });

  it('menolak field tak dikenal tidak menyebabkan galat (diabaikan) tapi tidak mengubah bentuk output', () => {
    const parsed = profileInputSchema.parse({ ...valid, uid: 'orang-lain', isAdmin: true });
    expect(parsed).not.toHaveProperty('uid');
    expect(parsed).not.toHaveProperty('isAdmin');
  });
});
