import type { Book, BookStatus } from '../types/book';

export const CURRENT_STORAGE_VERSION = 1;
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

  const b = data as Partial<Book>;

  const sanitized: Book = {
    id: b.id!.trim(),
    title: b.title!.trim(),
    author: b.author!.trim(),
    category: Array.isArray(b.category) ? b.category.filter((c): c is string => typeof c === 'string') : [],
    coverUrl: b.coverUrl!.trim(),
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

  if (typeof b.volume === 'number' && !isNaN(b.volume)) {
    sanitized.volume = b.volume;
  }

  if (typeof b.chapter === 'number' && !isNaN(b.chapter)) {
    sanitized.chapter = b.chapter;
  }

  if (typeof b.volumesOwned === 'number' && !isNaN(b.volumesOwned)) {
    sanitized.volumesOwned = b.volumesOwned;
  }

  if (typeof b.totalVolumes === 'number' && !isNaN(b.totalVolumes)) {
    sanitized.totalVolumes = b.totalVolumes;
  }

  if (Array.isArray(b.ownedVolumes)) {
    sanitized.ownedVolumes = b.ownedVolumes.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  }

  if (Array.isArray(b.readVolumes)) {
    sanitized.readVolumes = b.readVolumes.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  }

  return sanitized;
}

export function parseStoredBooks(raw: string | null): Book[] | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    // Support envelope format: { version: 1, books: [...] }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const envelope = parsed as Partial<StorageEnvelope>;
      if (Array.isArray(envelope.books)) {
        return envelope.books.map(sanitizeBook).filter((b): b is Book => b !== null);
      }
    }

    // Support legacy raw array format: Book[]
    if (Array.isArray(parsed)) {
      return parsed.map(sanitizeBook).filter((b): b is Book => b !== null);
    }
  } catch (err) {
    console.warn('Storage format corrupted, returning empty shelf fallback:', err);
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
