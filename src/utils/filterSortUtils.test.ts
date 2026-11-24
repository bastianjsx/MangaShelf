import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterBooks, sortBooks, calculateStatusCounts } from './filterSortUtils.ts';
import type { Book } from '../types/book.ts';

const SAMPLE_BOOKS: Book[] = [
  {
    id: '1',
    title: 'Blue Box',
    author: 'Kouji Miura',
    category: ['Manga', 'Romance', 'Sports'],
    coverUrl: '',
    status: 'reading',
    ownedVolumes: [1, 2, 3],
    readVolumes: [1],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Chainsaw Man',
    author: 'Tatsuki Fujimoto',
    category: ['Manga', 'Action'],
    coverUrl: '',
    status: 'finished',
    ownedVolumes: [1, 2],
    readVolumes: [1, 2],
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('filterSortUtils', () => {
  it('filters books by active status correctly', () => {
    const reading = filterBooks(SAMPLE_BOOKS, [], 'reading', 'full-cover');
    assert.strictEqual(reading.length, 1);
    assert.strictEqual(reading[0].title, 'Blue Box');
  });

  it('filters books by categories', () => {
    const results = filterBooks(SAMPLE_BOOKS, ['Action'], 'all', 'full-cover');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, 'Chainsaw Man');
  });

  it('sorts books by recent and title', () => {
    const sortedTitle = sortBooks(SAMPLE_BOOKS, 'title-asc');
    assert.strictEqual(sortedTitle[0].title, 'Blue Box');

    const sortedRecent = sortBooks(SAMPLE_BOOKS, 'recent');
    assert.strictEqual(sortedRecent[0].title, 'Chainsaw Man');
  });

  it('calculates status counts for covers', () => {
    const counts = calculateStatusCounts(SAMPLE_BOOKS, 'full-cover');
    assert.strictEqual(counts.all, 2);
    assert.strictEqual(counts.reading, 1);
    assert.strictEqual(counts.finished, 1);
  });
});
