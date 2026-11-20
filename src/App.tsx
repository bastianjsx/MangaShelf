import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  type Book,
  type ShelfDisplayMode,
} from './types/book';
import { Header } from './components/layout/Header';
import type { StatusFilter } from './components/layout/StatusBar';
import { Bookshelf } from './components/bookshelf/Bookshelf';
import { BookDetailModal } from './components/book/BookDetailModal';
import { AniListLoginModal } from './components/auth/AniListLoginModal';
import {
  getSpinePalette,
  getSpineColorSortScore,
  getBookOwnedVolumes,
  getVolumeStatus,
} from './utils/spineUtils';
import { useAniListAuth } from './hooks/useAniListAuth';
import { useBookshelfStorage } from './hooks/useBookshelfStorage';

export function App() {
  const {
    books,
    shelfMode,
    sortBy,
    setShelfMode,
    setSortBy,
    syncRemoteBooks,
    handleAddBook,
    handleDeleteBook: deleteBookFromStorage,
    handleReorderBooks,
    handleUpdateStatus,
    handleUpdateProgress,
  } = useBookshelfStorage();

  const {
    user,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isSyncing,
    handleLoginClick,
    handleLogout,
    handleDirectTokenSubmit,
    handleSyncManga,
  } = useAniListAuth({
    onSyncManga: syncRemoteBooks,
  });

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const selectedBook = useMemo(
    () => (selectedBookId ? books.find((b) => b.id === selectedBookId) ?? null : null),
    [books, selectedBookId]
  );

  useEffect(() => {
    const preventGlobalDrop = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventGlobalDrop);
    window.addEventListener('drop', preventGlobalDrop);
    return () => {
      window.removeEventListener('dragover', preventGlobalDrop);
      window.removeEventListener('drop', preventGlobalDrop);
    };
  }, []);

  const existingBookIds = useMemo(() => new Set(books.map((b) => b.id)), [books]);

  const categories = useMemo(() => {
    const excludedCategories = new Set(['manga', 'light novel']);
    const bookCategories = books.flatMap((b) => b.category || []);
    return Array.from(new Set(bookCategories))
      .filter(Boolean)
      .filter((cat) => !excludedCategories.has(cat.toLowerCase().trim()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [books]);

  const categoryCounts = useMemo(() => {
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
  }, [books, categories]);

  const statusCounts = useMemo(() => {
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
  }, [books, shelfMode]);

  const handleToggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const handleSelectAllCategories = useCallback(() => {
    setSelectedCategories([...categories]);
  }, [categories]);

  const handleClearAllCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const handleDeleteBook = useCallback(
    (bookId: string) => {
      deleteBookFromStorage(bookId);
      setSelectedBookId(null);
    },
    [deleteBookFromStorage]
  );

  const handleClearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedStatus('all');
  }, []);

  const handleSelectShelfMode = useCallback(
    (mode: ShelfDisplayMode) => {
      setShelfMode(mode);
    },
    [setShelfMode]
  );

  const filteredBooks = useMemo(() => {
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
  }, [books, selectedCategories, selectedStatus, shelfMode]);

  const displayBooks = useMemo(() => {
    const list = [...filteredBooks];
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
  }, [filteredBooks, sortBy]);

  return (
    <div className="min-h-screen px-3 md:px-7 py-5 flex flex-col items-center">
      <main
        className="w-full max-w-7xl flex-1 flex flex-col bg-shell-bg border border-shell-border rounded-2xl px-3.5 py-6 md:px-6 md:pt-8 md:pb-11 relative shadow-[0_16px_40px_rgba(139,90,43,0.08),0_2px_8px_rgba(0,0,0,0.03)] box-border"
        id="main-content"
      >
        <Header
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          onSelectAllCategories={handleSelectAllCategories}
          onClearAllCategories={handleClearAllCategories}
          categoryCounts={categoryCounts}
          sortBy={sortBy}
          onSelectSort={setSortBy}
          shelfMode={shelfMode}
          onSelectShelfMode={handleSelectShelfMode}
          onAddBook={handleAddBook}
          existingBookIds={existingBookIds}
          activeStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          statusCounts={statusCounts}
          user={user}
          onLoginClick={handleLoginClick}
          onLogout={handleLogout}
          onSync={() => user && handleSyncManga(user.id)}
          isSyncing={isSyncing}
          totalBooksCount={books.length}
        />
        <Bookshelf
          books={displayBooks}
          shelfMode={shelfMode}
          totalBooksCount={books.length}
          onClearFilter={handleClearAllFilters}
          onSelectBook={(b: Book) => setSelectedBookId(b.id)}
          onReorderBooks={handleReorderBooks}
          activeStatus={selectedStatus}
        />
      </main>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBookId(null)}
          onUpdateStatus={handleUpdateStatus}
          onUpdateProgress={handleUpdateProgress}
          onDeleteBook={handleDeleteBook}
        />
      )}

      <AniListLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onDirectTokenSubmit={handleDirectTokenSubmit}
      />
    </div>
  );
}

export default App;
