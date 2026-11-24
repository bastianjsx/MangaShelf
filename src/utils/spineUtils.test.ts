import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashString,
  hexToHsl,
  getBookOwnedVolumes,
  getBookReadVolumes,
  getColorFamily,
  mapToSoftPalette,
} from './spineUtils.ts';
import { migrateBookData, sanitizeBook, isValidNonNegativeInteger, isValidPositiveInteger } from './storageValidation.ts';

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

  it('differentiates shades for different titles with the same cover color', () => {
    const blueCoverHex = '#8BC9E8';
    const titleAColor = mapToSoftPalette(blueCoverHex, { title: 'Blue Box', titleIndex: 0 });
    const titleBColor = mapToSoftPalette(blueCoverHex, { title: 'Grand Blue', titleIndex: 1 });
    // Both are in the blue family, but each title has a distinct shade of navy
    assert.strictEqual(getColorFamily(titleAColor), 'blue');
    assert.strictEqual(getColorFamily(titleBColor), 'blue');
    assert.notStrictEqual(titleAColor, titleBColor);
  });

  it('provides subtle volume nuance across volumes of the same series', () => {
    const vol1Color = mapToSoftPalette('#8BC9E8', { title: 'Blue Box', volumeNumber: 1 });
    const vol2Color = mapToSoftPalette('#8BC9E8', { title: 'Blue Box', volumeNumber: 2 });
    assert.strictEqual(getColorFamily(vol1Color), 'blue');
    assert.strictEqual(getColorFamily(vol2Color), 'blue');
    assert.notStrictEqual(vol1Color, vol2Color);
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

    const bookWithSelectedVolumes = {
      id: 'test-owned-1',
      title: 'Test Manga',
      author: 'Author',
      category: ['Manga'],
      coverUrl: '',
      ownedVolumes: [2, 5, 8],
    };
    assert.deepStrictEqual(getBookOwnedVolumes(bookWithSelectedVolumes), [2, 5, 8]);

    const bookWithEmptyOwnedVolumes = {
      id: 'test-owned-0',
      title: 'Test Manga',
      author: 'Author',
      category: ['Manga'],
      coverUrl: '',
      ownedVolumes: [],
    };
    assert.deepStrictEqual(getBookOwnedVolumes(bookWithEmptyOwnedVolumes), []);
  });

  it('getBookReadVolumes returns all read volumes without truncating to owned [1]', () => {
    const bookWith12ReadVolumes = {
      id: 'test-2',
      title: 'Test Manga',
      author: 'Author',
      category: ['Manga'],
      coverUrl: '',
      readVolumes: Array.from({ length: 12 }, (_, i) => i + 1),
      volume: 12,
    };

    const read = getBookReadVolumes(bookWith12ReadVolumes);
    assert.strictEqual(read.length, 12);
    assert.deepStrictEqual(read, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    const bookWithVolumeOnly = {
      id: 'test-3',
      title: 'Test Manga',
      author: 'Author',
      category: ['Manga'],
      coverUrl: '',
      volume: 12,
    };
    const readFromVolume = getBookReadVolumes(bookWithVolumeOnly);
    assert.strictEqual(readFromVolume.length, 12);
    assert.deepStrictEqual(readFromVolume, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe('storageValidation', () => {
  it('isValidNonNegativeInteger and isValidPositiveInteger check integer boundaries', () => {
    assert.strictEqual(isValidNonNegativeInteger(0), true);
    assert.strictEqual(isValidNonNegativeInteger(10), true);
    assert.strictEqual(isValidNonNegativeInteger(-1), false);
    assert.strictEqual(isValidNonNegativeInteger(1.5), false);
    assert.strictEqual(isValidNonNegativeInteger(Infinity), false);
    assert.strictEqual(isValidNonNegativeInteger('5'), false);

    assert.strictEqual(isValidPositiveInteger(0), false);
    assert.strictEqual(isValidPositiveInteger(1), true);
    assert.strictEqual(isValidPositiveInteger(10), true);
    assert.strictEqual(isValidPositiveInteger(-1), false);
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

  it('safely clamps huge volume values to 9999 without memory explosion', () => {
    const hugeBook = {
      id: 'huge',
      title: 'Huge Book',
      author: 'Author',
      category: ['Manga'],
      coverUrl: '',
      volumesOwned: 1000000,
      volume: 1000000,
    };

    const owned = getBookOwnedVolumes(hugeBook);
    assert.strictEqual(owned.length, 9999);
    assert.strictEqual(owned[owned.length - 1], 9999);

    const read = getBookReadVolumes(hugeBook);
    assert.strictEqual(read.length, 9999);
  });
});
