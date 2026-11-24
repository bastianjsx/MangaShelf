import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeRemoteWithLocal } from './useBookshelfStorage.ts';
import type { Book } from '../types/book.ts';

describe('mergeRemoteWithLocal', () => {
  it('reconciles remote volume progress and read volumes when book already exists locally', () => {
    const localBook: Book = {
      id: 'anilist-100',
      title: 'Chainsaw Man',
      author: 'Tatsuki Fujimoto',
      category: ['Manga'],
      coverUrl: 'https://example.com/csm.jpg',
      volume: 1,
      readVolumes: [1],
      ownedVolumes: [1],
      volumesOwned: 1,
      status: 'reading',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const remoteBook: Book = {
      id: 'anilist-100',
      title: 'Chainsaw Man',
      author: 'Tatsuki Fujimoto',
      category: ['Manga'],
      coverUrl: 'https://example.com/csm.jpg',
      volume: 12,
      readVolumes: Array.from({ length: 12 }, (_, i) => i + 1),
      ownedVolumes: Array.from({ length: 12 }, (_, i) => i + 1),
      volumesOwned: 12,
      chapter: 97,
      status: 'finished',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const merged = mergeRemoteWithLocal(localBook, remoteBook);

    assert.strictEqual(merged.volume, 12);
    assert.strictEqual(merged.chapter, 97);
    assert.strictEqual(merged.status, 'finished');
    assert.deepStrictEqual(merged.readVolumes, Array.from({ length: 12 }, (_, i) => i + 1));
    assert.deepStrictEqual(merged.ownedVolumes, Array.from({ length: 12 }, (_, i) => i + 1));
    assert.strictEqual(merged.volumesOwned, 12);
  });

  it('preserves existing local custom owned volumes while expanding to cover remote read progress', () => {
    const localBook: Book = {
      id: 'anilist-101',
      title: 'Spy x Family',
      author: 'Tatsuya Endo',
      category: ['Manga'],
      coverUrl: 'https://example.com/sxf.jpg',
      volume: 2,
      readVolumes: [1, 2],
      ownedVolumes: [1, 2, 5, 6],
      volumesOwned: 4,
      status: 'reading',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const remoteBook: Book = {
      id: 'anilist-101',
      title: 'Spy x Family',
      author: 'Tatsuya Endo',
      category: ['Manga'],
      coverUrl: 'https://example.com/sxf.jpg',
      volume: 4,
      readVolumes: [1, 2, 3, 4],
      status: 'reading',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const merged = mergeRemoteWithLocal(localBook, remoteBook);

    assert.strictEqual(merged.volume, 4);
    assert.deepStrictEqual(merged.readVolumes, [1, 2, 3, 4]);
    // Union of local [1, 2, 5, 6] + read [1, 2, 3, 4] => [1, 2, 3, 4, 5, 6]
    assert.deepStrictEqual(merged.ownedVolumes, [1, 2, 3, 4, 5, 6]);
    assert.strictEqual(merged.volumesOwned, 6);
  });
});
