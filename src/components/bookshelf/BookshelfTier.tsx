import type { Book, ShelfDisplayMode } from '../../types/book';
import { BookCover } from '../book/BookCover';
import { BookSpine } from '../book/BookSpine';

export interface ShelfItem {
  key: string;
  kind: 'cover' | 'spine';
  book?: Book;
  volumeNumber?: number;
  titleIndex?: number;
}

interface BookshelfTierProps {
  items: ShelfItem[];
  tierIndex: number;
  isLastTier: boolean;
  shelfMode: ShelfDisplayMode;
  maxCoversPerRow: number;
  fullRowCoverGap: number;
  onSelectBook?: (book: Book) => void;
  onHoverBook: (
    book: Book,
    volumeNumber: number | undefined,
    element: HTMLElement,
    titleIndex?: number
  ) => void;
  onLeaveBook: () => void;
  onReorderBooks?: (sourceBookId: string, targetBookId: string) => void;
}

export function BookshelfTier({
  items,
  tierIndex,
  isLastTier,
  shelfMode,
  maxCoversPerRow,
  fullRowCoverGap,
  onSelectBook,
  onHoverBook,
  onLeaveBook,
  onReorderBooks,
}: BookshelfTierProps) {
  const isPureCoverRow =
    shelfMode === 'full-cover' && items.every((item) => item.kind === 'cover');
  const isFullCoverRow = isPureCoverRow && items.length >= maxCoversPerRow;
  const rowJustifyClass = isFullCoverRow
    ? 'justify-between'
    : isPureCoverRow
      ? 'justify-start'
      : 'justify-start gap-0';
  const rowGapStyle =
    !isFullCoverRow && isPureCoverRow ? { gap: `${fullRowCoverGap}px` } : undefined;

  return (
    <div key={`tier-${tierIndex}`} className="relative flex flex-col w-full">
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
            {items.map((item) => {
              if (item.kind === 'cover' && item.book) {
                return (
                  <BookCover
                    key={item.key}
                    book={item.book}
                    volumeNumber={item.volumeNumber}
                    titleIndex={item.titleIndex}
                    onSelectBook={onSelectBook}
                    onHoverBook={onHoverBook}
                    onLeaveBook={onLeaveBook}
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
                    onSelectBook={onSelectBook}
                    onHoverBook={onHoverBook}
                    onLeaveBook={onLeaveBook}
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
}
