import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Book, BookStatus, ShelfDisplayMode } from '../../types/book';
import type { StatusFilter } from '../layout/StatusBar';
import { BookCover } from '../book/BookCover';
import { BookSpine } from '../book/BookSpine';
import { EmptyState } from '../EmptyState';
import { getSpinePalette, getBookOwnedVolumes, getBookReadVolumes, getVolumeStatus } from '../../utils/spineUtils';

interface BookshelfProps {
  books: Book[];
  shelfMode?: ShelfDisplayMode;
  totalBooksCount: number;
  onClearFilter: () => void;
  onSelectBook?: (book: Book) => void;
  onReorderBooks?: (sourceBookId: string, targetBookId: string) => void;
  activeStatus?: StatusFilter;
}

interface ShelfItem {
  key: string;
  kind: 'cover' | 'spine';
  book?: Book;
  volumeNumber?: number;
  titleIndex?: number;
}

interface HoveredBookState {
  book: Book;
  volumeNumber?: number;
  titleIndex?: number;
  left: number;
  top: number;
  shelfMode: ShelfDisplayMode;
  page: number;
}

const MAX_ROWS_PER_PAGE = 4;
const MIN_SHELVES = 2; 
const SPINE_SLOT_WIDTH = 24;
const HOVER_CARD_WIDTH = 248;

const STATUS_BADGE_MAP: Record<
  Exclude<BookStatus, 'none'>,
  { label: string; dotClass: string; pillClass: string }
> = {
  reading: {
    label: 'Reading',
    dotClass: 'bg-amber-500',
    pillClass: 'bg-[#FBF3E4] text-[#8C5828] border-[#E7D4B5]',
  },
  finished: {
    label: 'Finished',
    dotClass: 'bg-emerald-600',
    pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  'want-to-read': {
    label: 'Want to Read',
    dotClass: 'bg-sky-500',
    pillClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  'on-hold': {
    label: 'On Hold',
    dotClass: 'bg-stone-400',
    pillClass: 'bg-stone-100 text-stone-700 border-stone-200',
  },
};

function formatHoverVolumeLabel(book: Book): string {
  const nums = getBookOwnedVolumes(book);
  if (nums.length <= 1) {
    return `Vol. ${nums[0] ?? 1}`;
  }
  const min = nums[0];
  const max = nums[nums.length - 1];
  if (max - min + 1 === nums.length) {
    return `Vol. ${min} – ${max}`;
  }
  return `Vol. ${min} – ${max} (${nums.length} vols)`;
}

function BookHoverCard({ hovered }: { hovered: HoveredBookState }) {
  const { book, volumeNumber, left, top } = hovered;
  const [imgFailed, setImgFailed] = useState(false);
  const derivedStatus =
    volumeNumber != null
      ? getVolumeStatus(book, volumeNumber)
      : book.status && book.status !== 'none'
        ? book.status
        : null;
  const statusInfo = derivedStatus ? STATUS_BADGE_MAP[derivedStatus] : null;
  const volLabel =
    volumeNumber != null ? `Vol. ${volumeNumber}` : formatHoverVolumeLabel(book);
  const palette = getSpinePalette(book, hovered.titleIndex);

  return (
    <div
      className="absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${left}px`, top: `${top}px`, width: `${HOVER_CARD_WIDTH}px` }}
      role="tooltip"
    >
      <div className="bg-[#FFFDF9] border border-[#E5D8C5] rounded-xl p-2.5 shadow-[0_14px_30px_rgba(45,25,10,0.22),0_4px_10px_rgba(0,0,0,0.08)] flex items-center gap-3">
        <div className="w-13.5 h-19.5 shrink-0 rounded-md overflow-hidden relative bg-[#EFE6D8] border border-black/10 shadow-xs">
          {book.coverUrl && !imgFailed ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              width={54}
              height={78}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover block"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-1 text-center"
              style={{ backgroundColor: palette.bg, color: palette.text }}
            >
              <span className="text-[9px] font-bold leading-tight line-clamp-3">
                {book.title}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="text-[13px] font-bold text-text-primary leading-tight truncate">
            {book.title}
          </div>
          <div className="text-[11px] text-text-secondary truncate">
            {book.author}
          </div>
          <div className="text-[11px] font-medium text-text-secondary/90 mt-0.5">
            {volLabel}
          </div>

          {statusInfo && (
            <div className="mt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${statusInfo.pillClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [prevFilterKey, setPrevFilterKey] = useState(`${shelfMode}-${activeStatus}`);

  if (prevFilterKey !== `${shelfMode}-${activeStatus}`) {
    setPrevFilterKey(`${shelfMode}-${activeStatus}`);
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
      const volumeNumbers =
        shelfMode === 'full-spine' && activeStatus && activeStatus !== 'all'
          ? allOwnedVolumes.filter((v) => getVolumeStatus(book, v, readSet) === activeStatus)
          : allOwnedVolumes;

      if (volumeNumbers.length === 0) {
        continue;
      }

      const lowestVol = volumeNumbers.includes(1) ? 1 : (volumeNumbers[0] ?? 1);

      if (shelfMode === 'full-cover') {
        items.push({
          key: `cover-${book.id}-vol-${lowestVol}`,
          kind: 'cover',
          book,
          volumeNumber: lowestVol,
          titleIndex,
        });
      } else {
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
    const isSpineMode = shelfMode === 'full-spine';

    for (const item of items) {
      const currIsCover = item.kind === 'cover';
      const baseWidth = currIsCover ? 100 : SPINE_SLOT_WIDTH;
      const minGap = currentShelf.length === 0 ? 0 : (currIsCover ? (isSpineMode ? 0 : 12) : 0);
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
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const handleHoverBook = useCallback(
    (
      book: Book,
      volumeNumber: number | undefined,
      rect: DOMRect,
      titleIndex?: number
    ) => {
      const containerEl = containerRef.current;
      if (!containerEl) return;
      const containerRect = containerEl.getBoundingClientRect();
      const rawLeft =
        rect.left - containerRect.left + rect.width / 2 - HOVER_CARD_WIDTH / 2;
      const clampedLeft = Math.max(
        10,
        Math.min(rawLeft, containerRect.width - HOVER_CARD_WIDTH - 10)
      );
      const top = rect.top - containerRect.top - 48;
      setHoveredBook({
        book,
        volumeNumber,
        titleIndex,
        left: clampedLeft,
        top,
        shelfMode,
        page: safeCurrentPage,
      });
    },
    [shelfMode, safeCurrentPage]
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
    hoveredBook.page === safeCurrentPage &&
    books.some((b) => b.id === hoveredBook.book.id)
      ? hoveredBook
      : null;

  const currentTiers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * MAX_ROWS_PER_PAGE;
    const pageRows = allRows.slice(startIndex, startIndex + MAX_ROWS_PER_PAGE);

    while (pageRows.length < MIN_SHELVES) {
      pageRows.push([]);
    }

    return pageRows;
  }, [allRows, safeCurrentPage]);

  if (totalBooksCount === 0) {
    return (
      <div className="relative w-full rounded-2xl bg-bookshelf-bg border border-shell-border/80 py-10 px-4 shadow-[inset_0_2px_6px_rgba(90,55,20,0.04)]">
        <EmptyState type="empty-library" />
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="relative w-full rounded-2xl bg-bookshelf-bg border border-shell-border/80 py-10 px-4 shadow-[inset_0_2px_6px_rgba(90,55,20,0.04)]">
        <EmptyState type="no-matches" onClearFilter={onClearFilter} activeStatus={activeStatus} />
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
            {currentTiers.map((shelfItems, tierIndex) => {
              const isLastTier = tierIndex === currentTiers.length - 1;
              const isPureCoverRow =
                shelfMode === 'full-cover' &&
                shelfItems.every((item) => item.kind === 'cover');
              const isFullCoverRow =
                isPureCoverRow && shelfItems.length >= maxCoversPerRow;
              const rowJustifyClass = isFullCoverRow
                ? 'justify-between'
                : isPureCoverRow
                  ? 'justify-start'
                  : 'justify-start gap-0';
              const rowGapStyle =
                !isFullCoverRow && isPureCoverRow ? { gap: `${fullRowCoverGap}px` } : undefined;

              return (
                <div
                  key={`tier-${tierIndex}`}
                  className="relative flex flex-col w-full"
                >
                  <div className="absolute top-0 inset-x-0 h-16 shelf-scalloped-spotlights pointer-events-none z-10" />

                  <div className="w-full bookcase-backboard relative min-h-40 pt-0 pb-0 flex flex-col justify-end">
                    <div className="timber-grain-vertical" />

                    <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-r from-[#2d1204]/20 via-[#2d1204]/06 to-transparent pointer-events-none z-15" />
                    <div className="absolute inset-y-0 right-0 w-2 bg-linear-to-l from-[#2d1204]/20 via-[#2d1204]/06 to-transparent pointer-events-none z-15" />

                    <div className="w-full relative z-20 pt-4 px-2 md:px-3 mb-0 overflow-hidden">
                      <div
                        className={`flex flex-nowrap items-end w-full ${rowJustifyClass}`}
                        style={rowGapStyle}
                      >
                        {shelfItems.map((item) => {
                          const currIsCover = item.kind === 'cover';

                          if (currIsCover && item.book) {
                            return (
                              <BookCover
                                key={item.key}
                                book={item.book}
                                volumeNumber={item.volumeNumber}
                                titleIndex={item.titleIndex}
                                onSelectBook={handleSelectBookFromShelf}
                                onHoverBook={handleHoverBook}
                                onLeaveBook={handleLeaveBook}
                                onReorderBooks={onReorderBooks}
                              />
                            );
                          }

                          if (item.book) {
                            return (
                              <BookSpine
                                key={item.key}
                                book={item.book}
                                volumeNumber={item.volumeNumber}
                                titleIndex={item.titleIndex}
                                onSelectBook={handleSelectBookFromShelf}
                                onHoverBook={handleHoverBook}
                                onLeaveBook={handleLeaveBook}
                              />
                            );
                          }

                          return null;
                        })}
                      </div>
                    </div>

                    <div className="shelf-plank-3d relative z-10 w-full">
                      <div className="shelf-plank-top-trapezoid w-full">
                        <div className="timber-grain-horizontal" />
                      </div>
                      {!isLastTier && (
                        <div className="shelf-plank-front-face w-full">
                          <div className="timber-grain-horizontal" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage(pageNum)}
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
