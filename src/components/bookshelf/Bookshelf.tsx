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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Book, ShelfDisplayMode } from '../../types/book';
import type { StatusFilter } from '../layout/StatusBar';
import { EmptyState } from '../EmptyState';
import { getBookOwnedVolumes, getBookReadVolumes, getVolumeStatus } from '../../utils/spineUtils';
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

const MIN_SHELVES = 2;
const SPINE_SLOT_WIDTH = 24;

export function Bookshelf({
  books,
  shelfMode = 'full-cover',
  totalBooksCount,
  onClearFilter,
  onSelectBook,
  onReorderBooks,
  activeStatus,
}: BookshelfProps) {
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

    while (rows.length < MIN_SHELVES) {
      rows.push([]);
    }

    return rows;
  }, [books, usableWidth, shelfMode, activeStatus]);

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={bookIds}
                strategy={horizontalListSortingStrategy}
              >
                {allRows.map((shelfItems, tierIndex) => (
                  <BookshelfTier
                    key={`tier-${tierIndex}`}
                    items={shelfItems}
                    tierIndex={tierIndex}
                    isLastTier={tierIndex === allRows.length - 1}
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
    </div>
  );
}
