import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { Book, ShelfDisplayMode, StatusFilter } from '../../types/book';
import { EmptyState } from '../EmptyState';
import {
  getBookOwnedVolumes,
  getBookReadVolumes,
  getVolumeStatus,
  SPINE_SLOT_WIDTH,
} from '../../utils/spineUtils';
import { BookHoverCard, type HoveredBookState } from './BookHoverCard';
import { BookshelfTier, type ShelfItem } from './BookshelfTier';

interface BookshelfProps {
  books: Book[];
  shelfMode?: ShelfDisplayMode;
  totalBooksCount: number;
  onClearFilter: () => void;
  onSelectBook?: (book: Book) => void;
  onReorderBooks?: (sourceBookId: string, targetBookId: string) => void;
  activeStatus?: StatusFilter;
}

const MAX_ROWS_PER_PAGE = 4;
const MIN_SHELVES = 2;

export function Bookshelf({
  books,
  shelfMode = 'full-cover',
  totalBooksCount,
  onClearFilter,
  onSelectBook,
  onReorderBooks,
  activeStatus,
}: BookshelfProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevFilterKey, setPrevFilterKey] = useState(() => `${shelfMode}-${activeStatus}-${books.length}`);

  const currentFilterKey = `${shelfMode}-${activeStatus}-${books.length}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredBook, setHoveredBook] = useState<HoveredBookState | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      const rect = el.getBoundingClientRect();
      const nextWidth = Math.round(rect.width);
      if (nextWidth > 0) {
        setContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const usableWidth = useMemo(() => {
    if (containerWidth > 0) {
      const chromeWidth = containerWidth >= 768 ? 44 : 32;
      return Math.max(280, containerWidth - chromeWidth);
    }
    return 960;
  }, [containerWidth]);

  const maxCoversPerRow = useMemo(() => {
    return Math.max(1, Math.floor((usableWidth + 12) / 112));
  }, [usableWidth]);

  const fullRowCoverGap = useMemo(() => {
    if (maxCoversPerRow <= 1) return 14;
    const available = usableWidth - maxCoversPerRow * 100;
    return Math.max(12, Math.floor((available / (maxCoversPerRow - 1)) * 10) / 10);
  }, [usableWidth, maxCoversPerRow]);

  const allRows = useMemo(() => {
    const items: ShelfItem[] = [];

    for (let titleIndex = 0; titleIndex < books.length; titleIndex++) {
      const book = books[titleIndex];
      const allOwnedVolumes = getBookOwnedVolumes(book);
      const readSet = new Set(getBookReadVolumes(book));

      if (shelfMode === 'full-cover') {
        const lowestVol =
          allOwnedVolumes.length > 0
            ? allOwnedVolumes.includes(1)
              ? 1
              : (allOwnedVolumes[0] ?? 1)
            : 1;

        items.push({
          key: `cover-${book.id}-vol-${lowestVol}`,
          kind: 'cover',
          book,
          volumeNumber: lowestVol,
          titleIndex,
        });
      } else {
        const volumeNumbers =
          activeStatus && activeStatus !== 'all'
            ? allOwnedVolumes.filter((v) => getVolumeStatus(book, v, readSet) === activeStatus)
            : allOwnedVolumes;

        if (volumeNumbers.length === 0) {
          if (!activeStatus || activeStatus === 'all' || book.status === activeStatus) {
            items.push({
              key: `spine-${book.id}-vol-none`,
              kind: 'spine',
              book,
              volumeNumber: undefined,
              titleIndex,
            });
          }
          continue;
        }

        for (const v of volumeNumbers) {
          items.push({
            key: `spine-${book.id}-vol-${v}`,
            kind: 'spine',
            book,
            volumeNumber: v,
            titleIndex,
          });
        }
      }
    }

    const rows: ShelfItem[][] = [];
    let currentShelf: ShelfItem[] = [];
    let currentWidth = 0;

    for (const item of items) {
      const currIsCover = item.kind === 'cover';
      const baseWidth = currIsCover ? 100 : SPINE_SLOT_WIDTH;
      const minGap = currentShelf.length === 0 ? 0 : (currIsCover ? 12 : 0);
      const additionalWidth = baseWidth + minGap;

      if (currentShelf.length > 0 && currentWidth + additionalWidth > usableWidth) {
        rows.push(currentShelf);
        currentShelf = [item];
        currentWidth = baseWidth;
      } else {
        currentShelf.push(item);
        currentWidth += additionalWidth;
      }
    }

    if (currentShelf.length > 0 || rows.length === 0) {
      rows.push(currentShelf);
    }

    return rows;
  }, [books, usableWidth, shelfMode, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(allRows.length / MAX_ROWS_PER_PAGE));
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const currentTiers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * MAX_ROWS_PER_PAGE;
    const pageRows = allRows.slice(startIndex, startIndex + MAX_ROWS_PER_PAGE);

    while (pageRows.length < MIN_SHELVES) {
      pageRows.push([]);
    }

    return pageRows;
  }, [allRows, safeCurrentPage]);

  const handlePageChange = useCallback((nextPage: number | ((prev: number) => number)) => {
    setHoveredBook(null);
    setCurrentPage(nextPage);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const bookIds = useMemo(() => books.map((b) => b.id), [books]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorderBooks?.(String(active.id), String(over.id));
      }
    },
    [onReorderBooks]
  );

  const handleHoverBook = useCallback(
    (
      book: Book,
      volumeNumber: number | undefined,
      element: HTMLElement,
      titleIndex?: number
    ) => {
      setHoveredBook({
        book,
        volumeNumber,
        titleIndex,
        targetEl: element,
        shelfMode,
      });
    },
    [shelfMode]
  );

  const handleLeaveBook = useCallback(() => {
    setHoveredBook(null);
  }, []);

  const handleSelectBookFromShelf = useCallback(
    (book: Book) => {
      setHoveredBook(null);
      onSelectBook?.(book);
    },
    [onSelectBook]
  );

  const activeHover =
    hoveredBook &&
    hoveredBook.shelfMode === shelfMode &&
    books.some((b) => b.id === hoveredBook.book.id)
      ? hoveredBook
      : null;

  if (totalBooksCount > 0 && books.length === 0) {
    return (
      <div className="relative w-full rounded-2xl bg-bookshelf-bg border border-shell-border/80 py-10 px-4 shadow-[inset_0_2px_6px_rgba(90,55,20,0.04)]">
        <EmptyState onClearFilter={onClearFilter} activeStatus={activeStatus} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative z-0 flex flex-col w-full select-none">
      <div className="relative w-full recessed-bookcase-frame overflow-hidden rounded-[3px]">
        <div className="relative h-2 md:h-2.5 w-full wood-grain-horizontal border-b border-[#74421b]/40 z-30">
          <div className="timber-grain-horizontal" />
        </div>

        <div className="relative flex w-full recessed-bookcase-interior">
          <div className="shrink-0 w-2 md:w-2.5 wood-grain-vertical border-r border-[#74421b]/40 z-25 relative shadow-[inset_-1px_0_3px_rgba(40,18,5,0.18)]">
            <div className="timber-grain-vertical" />
          </div>

          <div className="flex-1 flex flex-col min-w-0 relative">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={bookIds}
                strategy={rectSortingStrategy}
              >
                {currentTiers.map((shelfItems, tierIndex) => (
                  <BookshelfTier
                    key={`tier-${safeCurrentPage}-${tierIndex}`}
                    items={shelfItems}
                    isLastTier={tierIndex === currentTiers.length - 1}
                    shelfMode={shelfMode}
                    maxCoversPerRow={maxCoversPerRow}
                    fullRowCoverGap={fullRowCoverGap}
                    onSelectBook={handleSelectBookFromShelf}
                    onHoverBook={handleHoverBook}
                    onLeaveBook={handleLeaveBook}
                    onReorderBooks={onReorderBooks}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="shrink-0 w-2 md:w-2.5 wood-grain-vertical border-l border-[#74421b]/40 z-25 relative shadow-[inset_1px_0_3px_rgba(40,18,5,0.18)]">
            <div className="timber-grain-vertical" />
          </div>
        </div>

        <div className="shelf-plank-baseboard w-full z-10">
          <div className="timber-grain-horizontal" />
        </div>
      </div>

      {activeHover && (
        <BookHoverCard key={activeHover.book.id} hovered={activeHover} />
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Bookshelf pagination"
          className="flex items-center justify-end gap-1.5 mt-3 px-1"
        >
          <button
            type="button"
            onClick={() => handlePageChange((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-primary bg-pill-bg border border-pill-border hover:bg-pill-hover-bg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer select-none"
            aria-label="Previous page"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageChange(pageNum)}
                aria-current={safeCurrentPage === pageNum ? 'page' : undefined}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center justify-center ${
                  safeCurrentPage === pageNum
                    ? 'bg-plank-edge text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-[#EBDDC8]'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-primary bg-pill-bg border border-pill-border hover:bg-pill-hover-bg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer select-none"
            aria-label="Next page"
          >
            <span>Next</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  );
}
