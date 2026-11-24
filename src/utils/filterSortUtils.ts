import type { Book, BookStatus, ShelfDisplayMode, SortOption, StatusFilter } from '../types/book.ts';
import {
  getSpinePalette,
  getSpineColorSortScore,
  getBookOwnedVolumes,
  getBookReadVolumes,
  getVolumeStatus,
} from './spineUtils.ts';

const EXCLUDED_CATEGORIES = new Set(['manga', 'light novel']);
const titleCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

export function extractCategories(books: Book[]): string[] {
  const bookCategories = books.flatMap((b) => b.category || []);
  return Array.from(new Set(bookCategories))
    .filter(Boolean)
    .filter((cat) => !EXCLUDED_CATEGORIES.has(cat.toLowerCase().trim()))
    .sort((a, b) => titleCollator.compare(a, b));
}

export function calculateCategoryCounts(
  books: Book[],
  categories: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  categories.forEach((cat) => {
    counts[cat] = 0;
  });

  books.forEach((b) => {
    const uniqueCats = new Set(b.category || []);
    uniqueCats.forEach((cat) => {
      counts[cat] = (counts[cat] || 0) + 1;
    });
  });

  return counts;
}

export function calculateStatusCounts(
  books: Book[],
  shelfMode: ShelfDisplayMode
): Record<string, number> {
  if (shelfMode === 'full-spine') {
    const counts: Record<string, number> = {
      all: 0,
      reading: 0,
      finished: 0,
      'want-to-read': 0,
      'on-hold': 0,
    };
    books.forEach((b) => {
      const owned = getBookOwnedVolumes(b);
      const readSet = new Set(getBookReadVolumes(b));
      if (owned.length > 0) {
        counts.all += owned.length;
        owned.forEach((volNum) => {
          const st = getVolumeStatus(b, volNum, readSet);
          counts[st] = (counts[st] || 0) + 1;
        });
      } else {
        counts.all += 1;
        const st = (b.status && b.status !== 'none' ? b.status : 'want-to-read') as Exclude<BookStatus, 'none'>;
        counts[st] = (counts[st] || 0) + 1;
      }
    });
    return counts;
  }

  const counts: Record<string, number> = { all: books.length };
  books.forEach((b) => {
    if (b.status && b.status !== 'none') {
      counts[b.status] = (counts[b.status] || 0) + 1;
    }
  });
  return counts;
}

export function filterBooks(
  books: Book[],
  selectedCategories: string[],
  selectedStatus: StatusFilter,
  shelfMode: ShelfDisplayMode
): Book[] {
  const hasCategoryFilter = selectedCategories.length > 0;
  const selectedCategorySet = hasCategoryFilter ? new Set(selectedCategories) : null;

  return books.filter((book) => {
    if (hasCategoryFilter) {
      const bookCats = book.category || [];
      if (!bookCats.some((cat) => selectedCategorySet!.has(cat))) {
        return false;
      }
    }

    const matchesStatus =
      selectedStatus === 'all' ||
      (shelfMode === 'full-spine'
        ? (() => {
            const owned = getBookOwnedVolumes(book);
            const readSet = new Set(getBookReadVolumes(book));
            if (owned.length > 0) {
              return owned.some((v) => getVolumeStatus(book, v, readSet) === selectedStatus);
            }
            return book.status === selectedStatus;
          })()
        : book.status === selectedStatus);

    return matchesStatus;
  });
}

export function sortBooks(books: Book[], sortBy: SortOption): Book[] {
  const list = [...books];
  switch (sortBy) {
    case 'title-asc':
      return list.sort((a, b) => titleCollator.compare(a.title, b.title));
    case 'title-desc':
      return list.sort((a, b) => titleCollator.compare(b.title, a.title));
    case 'recent': {
      const withDates = list.map((book) => ({
        book,
        time: book.createdAt ? new Date(book.createdAt).getTime() : 0,
      }));
      withDates.sort((a, b) => {
        if (a.time !== b.time) return b.time - a.time;
        return titleCollator.compare(a.book.title, b.book.title);
      });
      return withDates.map((item) => item.book);
    }
    case 'color': {
      const withScores = list.map((book) => ({
        book,
        score: getSpineColorSortScore(getSpinePalette(book).bg),
      }));
      withScores.sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        return titleCollator.compare(a.book.title, b.book.title);
      });
      return withScores.map((item) => item.book);
    }
    case 'custom':
    default:
      return list;
  }
}
