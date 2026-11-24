import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Book, BookStatus, ShelfDisplayMode, SortOption } from '../types/book.ts';
import { getAniListToken, syncEntryToAniList } from '../services/anilistAuth.ts';
import { parseStoredBooks, serializeBooks } from '../utils/storageValidation.ts';
import { SyncQueue, type SyncPayload } from '../utils/syncQueue.ts';

const STORAGE_KEY = 'bookshelf_reading_tracker_books';
const SHELF_MODE_STORAGE_KEY = 'bookshelf_shelf_display_mode';
const SORT_BY_STORAGE_KEY = 'bookshelf_sort_by';

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
    if (parsed !== null) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load books from localStorage:', err);
  }
  return [];
}

export function mergeRemoteWithLocal(local: Book, remote: Book): Book {
  const localRead = Array.isArray(local.readVolumes) ? local.readVolumes : [];
  const remoteRead = Array.isArray(remote.readVolumes) ? remote.readVolumes : [];
  const mergedReadSet = new Set<number>([...localRead, ...remoteRead]);
  if (typeof remote.volume === 'number' && remote.volume > 0) {
    for (let i = 1; i <= Math.min(9999, remote.volume); i++) {
      mergedReadSet.add(i);
    }
  }
  const mergedReadVolumes = Array.from(mergedReadSet).sort((a, b) => a - b);

  const localOwned = Array.isArray(local.ownedVolumes) && local.ownedVolumes.length > 0
    ? local.ownedVolumes
    : (typeof local.volumesOwned === 'number' && local.volumesOwned > 0
      ? Array.from({ length: Math.min(9999, local.volumesOwned) }, (_, i) => i + 1)
      : []);
  const remoteOwned = Array.isArray(remote.ownedVolumes) ? remote.ownedVolumes : [];
  const mergedOwnedSet = new Set<number>([...localOwned, ...remoteOwned, ...mergedReadVolumes]);
  const mergedOwnedVolumes = mergedOwnedSet.size > 0
    ? Array.from(mergedOwnedSet).sort((a, b) => a - b)
    : undefined;

  const resolvedVolume = Math.max(
    remote.volume ?? 0,
    local.volume ?? 0,
    mergedReadVolumes.length > 0 ? Math.max(...mergedReadVolumes) : 0
  );

  const newStatus = remote.status && remote.status !== 'none' ? remote.status : local.status;
  const newChapter = remote.chapter !== undefined ? Math.max(remote.chapter, local.chapter || 0) : local.chapter;
  const newVolume = resolvedVolume > 0 ? resolvedVolume : local.volume;

  // Avoid replacing book object and bumping timestamps if nothing changed
  const hasChanged =
    newStatus !== local.status ||
    newChapter !== local.chapter ||
    newVolume !== local.volume ||
    JSON.stringify(mergedReadVolumes) !== JSON.stringify(local.readVolumes || []) ||
    JSON.stringify(mergedOwnedVolumes || []) !== JSON.stringify(local.ownedVolumes || []) ||
    (remote.title && remote.title !== local.title) ||
    (remote.coverUrl && remote.coverUrl !== local.coverUrl);

  if (!hasChanged) {
    return local;
  }

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

    // Local-owned metadata (preserve user modifications with reconciled progress)
    ownedVolumes: mergedOwnedVolumes ?? local.ownedVolumes,
    volumesOwned: mergedOwnedVolumes ? mergedOwnedVolumes.length : local.volumesOwned,
    readVolumes: mergedReadVolumes.length > 0 ? mergedReadVolumes : local.readVolumes,
    spineColor: local.spineColor ?? remote.spineColor,
    createdAt: local.createdAt,
    updatedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),

    // Intentional status reconciliation
    status: newStatus,
    chapter: newChapter,
    volume: newVolume,
  };
}

export function useBookshelfStorage() {
  const [books, setBooks] = useState<Book[]>(getInitialBooks);
  const [shelfMode, setShelfMode] = useState<ShelfDisplayMode>(getInitialShelfMode);
  const [sortBy, setSortBy] = useState<SortOption>(getInitialSortBy);
  const [mutationErrorsByBook, setMutationErrorsByBook] = useState<Record<string, string>>({});
  const [storageError, setStorageError] = useState<string | null>(null);

  const [syncQueue] = useState(
    () =>
      new SyncQueue({
        debounceMs: 200,
        onSync: async (mediaId, payload) => {
          const token = getAniListToken();
          if (!token) {
            throw new Error('Not signed in to AniList. Changes saved locally only.');
          }
          await syncEntryToAniList(token, mediaId, payload);
        },
        onStatusChange: (bookId, _status, error) => {
          setMutationErrorsByBook((prev) => {
            const next = { ...prev };
            if (error) {
              next[bookId] = error;
            } else {
              delete next[bookId];
            }
            return next;
          });
        },
      })
  );

  useEffect(() => {
    return () => {
      syncQueue.clearAll();
    };
  }, [syncQueue]);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = parseStoredBooks(e.newValue);
        if (parsed) {
          setBooks(parsed);
        }
      } else if (e.key === SHELF_MODE_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'full-cover' || e.newValue === 'full-spine') {
          setShelfMode(e.newValue);
        }
      } else if (e.key === SORT_BY_STORAGE_KEY && e.newValue) {
        setSortBy(e.newValue as SortOption);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const mutationError = useMemo(() => {
    if (storageError) return storageError;
    const errors = Object.values(mutationErrorsByBook).filter(Boolean);
    return errors.length > 0 ? errors[errors.length - 1] : null;
  }, [mutationErrorsByBook, storageError]);

  const clearMutationErrors = useCallback(() => {
    setMutationErrorsByBook({});
    setStorageError(null);
  }, []);

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

  // Debounced library serialization to avoid freezing on keystrokes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serializeBooks(books));
        setStorageError(null);
      } catch (err) {
        console.error('Failed to save books to localStorage:', err);
        setStorageError('Storage quota exceeded. Unable to save your changes locally.');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [books]);

  const syncToAniList = useCallback(
    (bookId: string, payload: SyncPayload, immediate = false): void => {
      if (!bookId.startsWith('anilist-')) return;

      const mediaId = parseInt(bookId.replace('anilist-', ''), 10);
      if (isNaN(mediaId)) return;

      const token = getAniListToken();
      if (!token) {
        setMutationErrorsByBook((prev) => ({
          ...prev,
          [bookId]: 'Not signed in to AniList. Changes saved locally only.',
        }));
        return;
      }

      syncQueue.enqueue(bookId, mediaId, payload, immediate);
    },
    [syncQueue]
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
      const now = new Date().toISOString();
      const initialStatus: BookStatus =
        newBook.status && newBook.status !== 'none' ? newBook.status : 'want-to-read';

      const preparedBook: Book = {
        ...newBook,
        status: initialStatus,
        createdAt: newBook.createdAt || now,
        updatedAt: now,
      };

      setBooks((prev) => {
        if (prev.some((b) => b.id === preparedBook.id)) {
          return prev;
        }
        return [preparedBook, ...prev];
      });

      syncToAniList(
        preparedBook.id,
        {
          status: initialStatus,
        },
        true
      );
      return true;
    },
    [syncToAniList]
  );

  const handleDeleteBook = useCallback((bookId: string) => {
    syncQueue.cancel(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, [syncQueue]);

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
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId ? { ...b, status, updatedAt: new Date().toISOString() } : b
        )
      );
      syncToAniList(bookId, { status });
      return true;
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
        const updated = { ...b, ...progress, updatedAt: new Date().toISOString() };
        if (typeof progress.chapter === 'number') {
          updated.chapter = Math.min(9999, Math.max(0, progress.chapter));
        }
        if (Array.isArray(progress.ownedVolumes)) {
          const valid = progress.ownedVolumes.filter((v) => v > 0 && v <= 9999);
          updated.ownedVolumes = valid;
          updated.volumesOwned = valid.length;
        }
        if (typeof progress.volume === 'number') {
          const clamped = Math.min(9999, Math.max(0, progress.volume));
          updated.volume = clamped;
          if (!progress.ownedVolumes && !updated.ownedVolumes) {
            updated.volumesOwned = clamped;
            updated.ownedVolumes =
              clamped > 0 ? Array.from({ length: clamped }, (_, i) => i + 1) : [];
          }
        }
        if (Array.isArray(progress.readVolumes)) {
          const valid = progress.readVolumes.filter((v) => v > 0 && v <= 9999);
          updated.readVolumes = valid;
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

      syncToAniList(bookId, {
        chapter: progress.chapter,
        progressVolumes: readVolumeProgress,
      });
      return true;
    },
    [syncToAniList]
  );

  return {
    books,
    shelfMode,
    sortBy,
    mutationError,
    clearMutationErrors,
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
