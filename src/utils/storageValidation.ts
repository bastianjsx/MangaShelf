import type { Book, BookStatus } from '../types/book';

export const CURRENT_STORAGE_VERSION = 2;
export const STORAGE_VERSION_KEY = 'bookshelf_storage_version';

const VALID_STATUSES = new Set<BookStatus>([
  'reading',
  'finished',
  'want-to-read',
  'on-hold',
  'none',
]);

interface StorageEnvelope {
  version: number;
  books: unknown[];
}

export function migrateBookData(rawBooks: unknown[], version: number): Book[] {
  const books = rawBooks.map(sanitizeBook).filter((b): b is Book => b !== null);

  if (version < 2) {
    // Migration v1 -> v2: Ensure ownedVolumes is decoupled from volume (reading progress)
    return books.map((book) => {
      const migrated = { ...book };
      if (!Array.isArray(migrated.ownedVolumes) || migrated.ownedVolumes.length === 0) {
        if (typeof migrated.volumesOwned === 'number' && migrated.volumesOwned > 0) {
          migrated.ownedVolumes = Array.from({ length: migrated.volumesOwned }, (_, i) => i + 1);
        }
      }
      return migrated;
    });
  }

  return books;
}

export function isValidPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function isValidBook(data: unknown): data is Book {
  if (!data || typeof data !== 'object') return false;

  const candidate = data as Partial<Book>;

  if (typeof candidate.id !== 'string' || candidate.id.trim() === '') return false;
  if (typeof candidate.title !== 'string') return false;
  if (typeof candidate.author !== 'string') return false;
  if (!Array.isArray(candidate.category)) return false;
  if (typeof candidate.coverUrl !== 'string') return false;

  return true;
}

export function sanitizeBook(data: unknown): Book | null {
  if (!isValidBook(data)) return null;

  const b = data;

  const sanitized: Book = {
    id: b.id.trim(),
    title: b.title.trim(),
    author: b.author.trim(),
    category: b.category.filter((c): c is string => typeof c === 'string'),
    coverUrl: b.coverUrl.trim(),
  };

  if (b.status && VALID_STATUSES.has(b.status)) {
    sanitized.status = b.status;
  }

  if (typeof b.spineColor === 'string' && b.spineColor.trim()) {
    sanitized.spineColor = b.spineColor.trim();
  }

  if (typeof b.spineImageUrl === 'string' && b.spineImageUrl.trim()) {
    sanitized.spineImageUrl = b.spineImageUrl.trim();
  }

  if (typeof b.description === 'string') {
    sanitized.description = b.description;
  }

  if (typeof b.releaseDate === 'string') {
    sanitized.releaseDate = b.releaseDate;
  }

  if (typeof b.createdAt === 'string') {
    sanitized.createdAt = b.createdAt;
  }

  if (typeof b.updatedAt === 'string') {
    sanitized.updatedAt = b.updatedAt;
  }

  if (typeof b.lastSyncedAt === 'string') {
    sanitized.lastSyncedAt = b.lastSyncedAt;
  }

  if (isValidPositiveInteger(b.volume) && b.volume <= 9999) {
    sanitized.volume = b.volume;
  }

  if (isValidPositiveInteger(b.chapter) && b.chapter <= 99999) {
    sanitized.chapter = b.chapter;
  }

  if (isValidPositiveInteger(b.volumesOwned) && b.volumesOwned <= 9999) {
    sanitized.volumesOwned = b.volumesOwned;
  }

  if (isValidPositiveInteger(b.totalVolumes) && b.totalVolumes > 0 && b.totalVolumes <= 9999) {
    sanitized.totalVolumes = b.totalVolumes;
  }

  if (Array.isArray(b.ownedVolumes)) {
    const validNums = b.ownedVolumes.filter((v): v is number => isValidPositiveInteger(v) && v > 0 && v <= 9999);
    sanitized.ownedVolumes = Array.from(new Set(validNums)).sort((a, b) => a - b);
  }

  if (Array.isArray(b.readVolumes)) {
    const validNums = b.readVolumes.filter((v): v is number => isValidPositiveInteger(v) && v > 0 && v <= 9999);
    sanitized.readVolumes = Array.from(new Set(validNums)).sort((a, b) => a - b);
  }

  return sanitized;
}

export function parseStoredBooks(raw: string | null): Book[] | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    // Support envelope format: { version: number, books: [...] }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const envelope = parsed as Partial<StorageEnvelope>;
      const version = typeof envelope.version === 'number' ? envelope.version : 1;
      if (Array.isArray(envelope.books)) {
        return migrateBookData(envelope.books, version);
      }
    }

    // Support legacy raw array format: Book[]
    if (Array.isArray(parsed)) {
      return migrateBookData(parsed, 1);
    }
  } catch (err) {
    console.warn('Storage format corrupted, archiving raw data to prevent data loss:', err);
    try {
      localStorage.setItem(`bookshelf_books_corrupted_${Date.now()}`, raw);
    } catch {
      // ignore storage quota error
    }
    return [];
  }

  return null;
}

export function serializeBooks(books: Book[]): string {
  const envelope: StorageEnvelope = {
    version: CURRENT_STORAGE_VERSION,
    books,
  };
  return JSON.stringify(envelope);
}
