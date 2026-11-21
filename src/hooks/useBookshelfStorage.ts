import { useState, useEffect, useCallback } from 'react';
import type { Book, BookStatus, ShelfDisplayMode, SortOption } from '../types/book';
import { getAniListToken, syncEntryToAniList } from '../services/anilistAuth';
import { parseStoredBooks, serializeBooks } from '../utils/storageValidation';

const STORAGE_KEY = 'bookshelf_reading_tracker_books';
const SHELF_MODE_STORAGE_KEY = 'bookshelf_shelf_display_mode';
const SORT_BY_STORAGE_KEY = 'bookshelf_sort_by';

const DEFAULT_BLUE_BOX: Book = {
  id: 'blue-box-ao-no-hako',
  title: 'Blue Box',
  author: 'Kouji Miura',
  category: ['Romance', 'Sports'],
  volumesOwned: 27,
  volume: 27,
  ownedVolumes: Array.from({ length: 27 }, (_, i) => i + 1),
  totalVolumes: 27,
  coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
  spineColor: '#368EAA',
  releaseDate: 'Apr 8, 2021',
  createdAt: '2021-04-08T00:00:00.000Z',
  description:
    'Taiki Inomata is on the boys badminton team at sports powerhouse Eimei Junior and Senior High. He is in love with Chinatsu Kano, a girl a year above him on the girls basketball team.',
  status: 'reading',
};

function getInitialSortBy(): SortOption {
  try {
    const saved = localStorage.getItem(SORT_BY_STORAGE_KEY);
    if (
      saved === 'recent' ||
      saved === 'title-asc' ||
      saved === 'title-desc' ||
      saved === 'color' ||
      saved === 'custom'
    ) {
      return saved;
    }
  } catch (err) {
    console.error('Failed to load sort option from localStorage:', err);
  }
  return 'title-asc';
}

function getInitialShelfMode(): ShelfDisplayMode {
  try {
    const saved = localStorage.getItem(SHELF_MODE_STORAGE_KEY);
    if (saved === 'full-cover' || saved === 'full-spine') {
      return saved;
    }
  } catch (err) {
    console.error('Failed to load shelf mode from localStorage:', err);
  }
  return 'full-cover';
}

function getInitialBooks(): Book[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = parseStoredBooks(saved);

    // If localStorage contained saved data (even an empty array []), respect it.
    if (parsed !== null) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load books from localStorage:', err);
  }
  // Only first-time visitors with no storage key receive the initial sample book.
  return [DEFAULT_BLUE_BOX];
}

function mergeRemoteWithLocal(local: Book, remote: Book): Book {
  return {
    // AniList-owned metadata
    id: remote.id,
    title: remote.title || local.title,
    author: remote.author || local.author,
    coverUrl: remote.coverUrl || local.coverUrl,
    description: remote.description || local.description,
    totalVolumes: remote.totalVolumes ?? local.totalVolumes,
    category: remote.category.length > 0 ? remote.category : local.category,
    releaseDate: remote.releaseDate || local.releaseDate,

    // Local-owned metadata (preserve user modifications)
    ownedVolumes: local.ownedVolumes,
    volumesOwned: local.volumesOwned,
    readVolumes: local.readVolumes,
    spineColor: local.spineColor ?? remote.spineColor,
    spineImageUrl: local.spineImageUrl ?? remote.spineImageUrl,
    createdAt: local.createdAt,

    // Intentional status reconciliation
    status: remote.status && remote.status !== 'none' ? remote.status : local.status,
    chapter: remote.chapter !== undefined ? Math.max(remote.chapter, local.chapter || 0) : local.chapter,
    volume: remote.volume !== undefined ? Math.max(remote.volume, local.volume || 0) : local.volume,
  };
}

export type MutationSyncState = 'idle' | 'syncing' | 'synced' | 'error';

export function useBookshelfStorage() {
  const [books, setBooks] = useState<Book[]>(getInitialBooks);
  const [shelfMode, setShelfMode] = useState<ShelfDisplayMode>(getInitialShelfMode);
  const [sortBy, setSortBy] = useState<SortOption>(getInitialSortBy);
  const [mutationStatus, setMutationStatus] = useState<MutationSyncState>('idle');
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SHELF_MODE_STORAGE_KEY, shelfMode);
    } catch (err) {
      console.error('Failed to save shelf mode to localStorage:', err);
    }
  }, [shelfMode]);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_BY_STORAGE_KEY, sortBy);
    } catch (err) {
      console.error('Failed to save sort option to localStorage:', err);
    }
  }, [sortBy]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeBooks(books));
    } catch (err) {
      console.error('Failed to save books to localStorage:', err);
    }
  }, [books]);

  const syncToAniList = useCallback(
    async (
      bookId: string,
      payload: {
        status?: BookStatus;
        volume?: number;
        progressVolumes?: number;
        chapter?: number;
      }
    ): Promise<boolean> => {
      const token = getAniListToken();
      if (!token || !bookId.startsWith('anilist-')) return true;

      const mediaId = parseInt(bookId.replace('anilist-', ''), 10);
      if (isNaN(mediaId)) return true;

      setMutationStatus('syncing');
      setMutationError(null);
      try {
        await syncEntryToAniList(token, mediaId, payload);
        setMutationStatus('synced');
        return true;
      } catch (err) {
        setMutationStatus('error');
        setMutationError(err instanceof Error ? err.message : 'Failed to sync with AniList');
        return false;
      }
    },
    []
  );

  const syncRemoteBooks = useCallback((remoteBooks: Book[]) => {
    setBooks((prev) => {
      const existingMap = new Map(prev.map((b) => [b.id, b]));
      const newEntries: Book[] = [];

      for (const remoteBook of remoteBooks) {
        const local = existingMap.get(remoteBook.id);
        if (local) {
          existingMap.set(remoteBook.id, mergeRemoteWithLocal(local, remoteBook));
        } else {
          newEntries.push(remoteBook);
        }
      }

      return [...newEntries, ...Array.from(existingMap.values())];
    });
  }, []);

  const handleAddBook = useCallback(
    async (newBook: Book): Promise<boolean> => {
      const preparedBook: Book = {
        ...newBook,
        createdAt: newBook.createdAt || new Date().toISOString(),
      };

      setBooks((prev) => {
        if (prev.some((b) => b.id === preparedBook.id)) {
          return prev;
        }
        return [preparedBook, ...prev];
      });

      return syncToAniList(preparedBook.id, {
        status: preparedBook.status || 'want-to-read',
      });
    },
    [syncToAniList]
  );

  const handleDeleteBook = useCallback((bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  const handleReorderBooks = useCallback((sourceBookId: string, targetBookId: string) => {
    if (sourceBookId === targetBookId) return;

    setBooks((prev) => {
      const sourceIndex = prev.findIndex((b) => b.id === sourceBookId);
      const targetIndex = prev.findIndex((b) => b.id === targetBookId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });

    setSortBy('custom');
  }, []);

  const handleUpdateStatus = useCallback(
    async (bookId: string, status: BookStatus): Promise<boolean> => {
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, status } : b)));
      return syncToAniList(bookId, { status });
    },
    [syncToAniList]
  );

  const handleUpdateProgress = useCallback(
    async (
      bookId: string,
      progress: {
        volume?: number;
        chapter?: number;
        volumesOwned?: number;
        ownedVolumes?: number[];
        readVolumes?: number[];
      }
    ): Promise<boolean> => {
      const applyProgressUpdate = (b: Book): Book => {
        const updated = { ...b, ...progress };
        if (Array.isArray(progress.ownedVolumes)) {
          updated.ownedVolumes = progress.ownedVolumes;
          updated.volume =
            progress.ownedVolumes.length > 0 ? Math.max(...progress.ownedVolumes) : 0;
          updated.volumesOwned = progress.ownedVolumes.length;
        } else if (typeof progress.volume === 'number') {
          updated.volumesOwned = progress.volume;
          updated.ownedVolumes =
            progress.volume > 0 ? Array.from({ length: progress.volume }, (_, i) => i + 1) : [];
        }
        if (Array.isArray(progress.readVolumes)) {
          updated.readVolumes = progress.readVolumes;
        } else if (Array.isArray(updated.ownedVolumes) && Array.isArray(updated.readVolumes)) {
          const ownedSet = new Set(updated.ownedVolumes);
          updated.readVolumes = updated.readVolumes.filter((v) => ownedSet.has(v));
        }
        return updated;
      };

      setBooks((prev) => prev.map((b) => (b.id === bookId ? applyProgressUpdate(b) : b)));

      // Accurately sync reading progress (volumes read), not physical volumes owned
      const readVolumeProgress =
        Array.isArray(progress.readVolumes) && progress.readVolumes.length > 0
          ? Math.max(...progress.readVolumes)
          : typeof progress.volume === 'number'
            ? progress.volume
            : undefined;

      return syncToAniList(bookId, {
        chapter: progress.chapter,
        progressVolumes: readVolumeProgress,
      });
    },
    [syncToAniList]
  );

  return {
    books,
    shelfMode,
    sortBy,
    mutationStatus,
    mutationError,
    setShelfMode,
    setSortBy,
    syncRemoteBooks,
    handleAddBook,
    handleDeleteBook,
    handleReorderBooks,
    handleUpdateStatus,
    handleUpdateProgress,
  };
}
