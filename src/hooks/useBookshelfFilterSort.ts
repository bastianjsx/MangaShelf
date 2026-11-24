import { useState, useMemo, useCallback } from 'react';
import type { Book, ShelfDisplayMode, SortOption, StatusFilter } from '../types/book';
import {
  extractCategories,
  calculateCategoryCounts,
  calculateStatusCounts,
  filterBooks,
  sortBooks,
} from '../utils/filterSortUtils';

export interface UseBookshelfFilterSortProps {
  books: Book[];
  shelfMode: ShelfDisplayMode;
  sortBy: SortOption;
}

export function useBookshelfFilterSort({
  books,
  shelfMode,
  sortBy,
}: UseBookshelfFilterSortProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const categories = useMemo(() => extractCategories(books), [books]);

  const categoryCounts = useMemo(
    () => calculateCategoryCounts(books, categories),
    [books, categories]
  );

  const statusCounts = useMemo(
    () => calculateStatusCounts(books, shelfMode),
    [books, shelfMode]
  );

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

  const handleClearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedStatus('all');
  }, []);

  const filteredBooks = useMemo(
    () => filterBooks(books, selectedCategories, selectedStatus, shelfMode),
    [books, selectedCategories, selectedStatus, shelfMode]
  );

  const displayBooks = useMemo(
    () => sortBooks(filteredBooks, sortBy),
    [filteredBooks, sortBy]
  );

  return {
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
  };
}
