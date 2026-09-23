import { describe, expect, it } from 'vitest';
import { createMemoryChatStore } from './store.js';

/**
 * Satu ajakan hanya boleh punya satu diskusi.
 *
 * Jaminannya berasal dari id dokumen percakapan yang memakai `activityId` apa adanya,
 * bukan id acak: memanggil getOrCreateActivityConversation berkali-kali untuk ajakan yang
 * sama akan menunjuk dokumen yang sama, sehingga tidak ada percakapan kembar meski beberapa
 * peserta membuka tab Diskusi pada saat bersamaan.
 */
describe('ChatStore.getOrCreateActivityConversation', () => {
  it('mengembalikan percakapan yang sama untuk ajakan yang sama', async () => {
    const store = createMemoryChatStore();

    const first = await store.getOrCreateActivityConversation('act-1', 'uid-a', 'Diskusi Ajakan');
    const second = await store.getOrCreateActivityConversation('act-1', 'uid-b', 'Diskusi Ajakan');

    expect(second.id).toBe(first.id);
    expect(second.id).toBe('act-1');
    expect(second.createdAt).toBe(first.createdAt);
  });

  it('memberi percakapan terpisah untuk ajakan yang berbeda', async () => {
    const store = createMemoryChatStore();

    const a = await store.getOrCreateActivityConversation('act-1', 'uid-a', 'Diskusi Ajakan');
    const b = await store.getOrCreateActivityConversation('act-2', 'uid-a', 'Diskusi Ajakan');

    expect(a.id).not.toBe(b.id);
  });

  it('tetap satu percakapan meski diminta berbarengan', async () => {
    const store = createMemoryChatStore();

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        store.getOrCreateActivityConversation('act-1', `uid-${i}`, 'Diskusi Ajakan'),
      ),
    );

    expect(new Set(results.map((r) => r.id)).size).toBe(1);
  });
});
