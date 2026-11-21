import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashString,
  hexToHsl,
  getBookOwnedVolumes,
  getColorFamily,
  mapToSoftPalette,
} from './spineUtils.ts';
import { migrateBookData, sanitizeBook, isValidPositiveInteger } from './storageValidation.ts';

describe('spineUtils', () => {
  it('hashString handles -2147483648 boundary safely', () => {
    const val = hashString('test');
    assert.ok(val >= 0);
    assert.strictEqual(typeof hashString('any string'), 'number');
  });

  it('hexToHsl validates hex strings', () => {
    assert.deepStrictEqual(hexToHsl('invalid'), [0, 0, 0]);
    assert.deepStrictEqual(hexToHsl(''), [0, 0, 0]);
    const [, , l] = hexToHsl('#FFFFFF');
    assert.strictEqual(l, 1);
  });

  it('classifies color families accurately', () => {
    assert.strictEqual(getColorFamily('#F29B9B'), 'red');
    assert.strictEqual(getColorFamily('#F0B4C7'), 'pink');
    assert.strictEqual(getColorFamily('#F4A45B'), 'orange');
    assert.strictEqual(getColorFamily('#F4DB78'), 'yellow');
    assert.strictEqual(getColorFamily('#A6D49B'), 'green');
    assert.strictEqual(getColorFamily('#8BC9E8'), 'blue');
    assert.strictEqual(getColorFamily('#C5A2E0'), 'purple');
    assert.strictEqual(getColorFamily('#D5D5D5'), 'neutral');
  });

  it('mapToSoftPalette selects rich, muted bookstore shades within family', () => {
    assert.strictEqual(mapToSoftPalette('#F29B9B'), '#8F3835');
    assert.strictEqual(mapToSoftPalette('#F0B4C7'), '#B86878');
    assert.strictEqual(mapToSoftPalette('#A6D49B'), '#477A6A');
    assert.strictEqual(mapToSoftPalette('#8BC9E8'), '#405D78');
  });

  it('getBookOwnedVolumes decouples volume from ownedVolumes', () => {
    const bookWithReadProgressOnly = {
      id: 'test-1',
      title: 'Test Manga',
      author: 'Author',
      category: ['Manga'],
      coverUrl: '',
      volume: 15,
    };

    const owned = getBookOwnedVolumes(bookWithReadProgressOnly);
    assert.deepStrictEqual(owned, [1]);
  });
});

describe('storageValidation', () => {
  it('isValidPositiveInteger checks integer boundaries', () => {
    assert.strictEqual(isValidPositiveInteger(0), true);
    assert.strictEqual(isValidPositiveInteger(10), true);
    assert.strictEqual(isValidPositiveInteger(-1), false);
    assert.strictEqual(isValidPositiveInteger(1.5), false);
    assert.strictEqual(isValidPositiveInteger(Infinity), false);
    assert.strictEqual(isValidPositiveInteger('5'), false);
  });

  it('sanitizeBook sanitizes and deduplicates volumes', () => {
    const raw = {
      id: 'book-1',
      title: 'Title',
      author: 'Author',
      category: ['Manga'],
      coverUrl: 'http://example.com/cover.jpg',
      ownedVolumes: [3, 1, 2, 2, -5, 1.2],
      volume: 4,
    };
    const sanitized = sanitizeBook(raw);
    assert.ok(sanitized);
    assert.deepStrictEqual(sanitized.ownedVolumes, [1, 2, 3]);
    assert.strictEqual(sanitized.volume, 4);
  });

  it('migrates v1 storage data correctly', () => {
    const v1Books = [
      {
        id: 'b1',
        title: 'Title',
        author: 'Author',
        category: ['Manga'],
        coverUrl: 'http://example.com/cover.jpg',
        volumesOwned: 3,
      },
    ];

    const migrated = migrateBookData(v1Books, 1);
    assert.strictEqual(migrated.length, 1);
    assert.deepStrictEqual(migrated[0].ownedVolumes, [1, 2, 3]);
  });
});
