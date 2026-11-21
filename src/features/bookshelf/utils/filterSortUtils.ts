import type { Book, ShelfDisplayMode, SortOption } from '../../../types/book';
import type { StatusFilter } from '../../../components/layout/StatusBar';
import {
  getSpinePalette,
  getSpineColorSortScore,
  getBookOwnedVolumes,
  getVolumeStatus,
} from '../../../utils/spineUtils';

const EXCLUDED_CATEGORIES = new Set(['manga', 'light novel']);

export function extractCategories(books: Book[]): string[] {
  const bookCategories = books.flatMap((b) => b.category || []);
  return Array.from(new Set(bookCategories))
    .filter(Boolean)
    .filter((cat) => !EXCLUDED_CATEGORIES.has(cat.toLowerCase().trim()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
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
      counts.all += owned.length;
      owned.forEach((volNum) => {
        const st = getVolumeStatus(b, volNum);
        counts[st] = (counts[st] || 0) + 1;
      });
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
  const seenIds = new Set<string>();

  return books.filter((book) => {
    if (seenIds.has(book.id)) return false;

    if (hasCategoryFilter) {
      const bookCats = book.category || [];
      if (!bookCats.some((cat) => selectedCategorySet!.has(cat))) {
        return false;
      }
    }

    const matchesStatus =
      selectedStatus === 'all' ||
      (shelfMode === 'full-spine'
        ? getBookOwnedVolumes(book).some((v) => getVolumeStatus(book, v) === selectedStatus)
        : book.status === selectedStatus);

    if (matchesStatus) {
      seenIds.add(book.id);
      return true;
    }
    return false;
  });
}

export function sortBooks(books: Book[], sortBy: SortOption): Book[] {
  const list = [...books];
  switch (sortBy) {
    case 'title-asc':
      return list.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      );
    case 'title-desc':
      return list.sort((a, b) =>
        b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
      );
    case 'recent': {
      const withDates = list.map((book) => ({
        book,
        time: book.createdAt ? new Date(book.createdAt).getTime() : 0,
      }));
      withDates.sort((a, b) => {
        if (a.time !== b.time) return b.time - a.time;
        return a.book.title.localeCompare(b.book.title, undefined, { sensitivity: 'base' });
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
        return a.book.title.localeCompare(b.book.title, undefined, { sensitivity: 'base' });
      });
      return withScores.map((item) => item.book);
    }
    case 'custom':
      return list;
    default:
      return list;
  }
}
