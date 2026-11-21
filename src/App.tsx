import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Book } from './types/book';
import { Header } from './components/layout/Header';
import { Bookshelf } from './components/bookshelf/Bookshelf';
import { BookDetailModal } from './components/book/BookDetailModal';
import { AniListLoginModal } from './components/auth/AniListLoginModal';
import { useAniListAuth } from './hooks/useAniListAuth';
import { useBookshelfStorage } from './hooks/useBookshelfStorage';
import { useBookshelfFilterSort } from './features/bookshelf/hooks/useBookshelfFilterSort';

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

  const {
    selectedCategories,
    selectedStatus,
    setSelectedStatus,
    categories,
    categoryCounts,
    statusCounts,
    handleToggleCategory,
    handleSelectAllCategories,
    handleClearAllCategories,
    handleClearAllFilters,
    displayBooks,
  } = useBookshelfFilterSort({
    books,
    shelfMode,
    sortBy,
  });

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

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

  const handleDeleteBook = useCallback(
    (bookId: string) => {
      deleteBookFromStorage(bookId);
      setSelectedBookId(null);
    },
    [deleteBookFromStorage]
  );

  const handleSync = useCallback(() => {
    if (user) {
      handleSyncManga(user.id);
    }
  }, [user, handleSyncManga]);

  const handleSelectBook = useCallback((b: Book) => {
    setSelectedBookId(b.id);
  }, []);

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
          onSelectShelfMode={setShelfMode}
          onAddBook={handleAddBook}
          existingBookIds={existingBookIds}
          activeStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          statusCounts={statusCounts}
          user={user}
          onLoginClick={handleLoginClick}
          onLogout={handleLogout}
          onSync={handleSync}
          isSyncing={isSyncing}
          totalBooksCount={books.length}
        />
        <Bookshelf
          books={displayBooks}
          shelfMode={shelfMode}
          totalBooksCount={books.length}
          onClearFilter={handleClearAllFilters}
          onSelectBook={handleSelectBook}
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
