import { memo, useState } from 'react';
import { type Book } from '../../types/book';
import { getSpinePalette } from '../../utils/spineUtils';

interface BookCoverProps {
  book: Book;
  volumeNumber?: number;
  titleIndex?: number;
  onSelectBook?: (book: Book) => void;
  onHoverBook?: (
    book: Book,
    volumeNumber: number | undefined,
    rect: DOMRect,
    titleIndex?: number
  ) => void;
  onLeaveBook?: () => void;
  onReorderBooks?: (sourceBookId: string, targetBookId: string) => void;
}

const MAX_TITLE_CHARS = 10;
const BOOK_DRAG_MIME = 'application/x-bookshelf-book-id';

function truncateTitle(title: string, maxChars = MAX_TITLE_CHARS): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}...`;
}

export const BookCover = memo(function BookCover({
  book,
  volumeNumber,
  titleIndex,
  onSelectBook,
  onHoverBook,
  onLeaveBook,
  onReorderBooks,
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!onReorderBooks) {
      e.preventDefault();
      return;
    }
    onLeaveBook?.();
    setIsDragging(true);
    e.dataTransfer.setData(BOOK_DRAG_MIME, book.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!onReorderBooks) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!onReorderBooks) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragging(false);
    const sourceId =
      e.dataTransfer.getData(BOOK_DRAG_MIME) || e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== book.id) {
      onReorderBooks(sourceId, book.id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectBook?.(book);
  };

  const palette = !book.coverUrl || imageError ? getSpinePalette(book, titleIndex) : undefined;
  const displayTitle = truncateTitle(book.title);
  const volLabel = volumeNumber ? `Vol. ${volumeNumber}` : 'Vol. 1';

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${book.title} (${volLabel})`}
      draggable={Boolean(onReorderBooks)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectBook?.(book);
        }
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          onHoverBook?.(book, volumeNumber, e.currentTarget.getBoundingClientRect(), titleIndex);
        }
      }}
      onMouseLeave={() => onLeaveBook?.()}
      className={`shrink-0 w-25 h-37.5 aspect-2/3 relative select-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-plank-edge focus-visible:outline-offset-2 rounded-[3px] touch-manipulation ${
        onReorderBooks ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isDragging
          ? 'opacity-35 scale-95 z-0'
          : isDragOver
            ? 'scale-105 z-40 ring-3 ring-[#8C5828] ring-offset-2 ring-offset-page-bg-start shadow-[0_12px_24px_rgba(45,25,10,0.35)]'
            : 'z-10 group hover:z-30'
      }`}
      title={onHoverBook ? undefined : `${book.title} (${volLabel})`}
    >
      <div className="absolute -bottom-0.5 inset-x-2 h-1 bg-[#3a1d08]/22 blur-[1px] rounded-full pointer-events-none z-0 shadow-[0_1px_2.5px_rgba(45,20,5,0.16)] transition-all duration-200 group-hover:opacity-20" />

      <div className="w-full h-full rounded-[3px] shadow-[0_2px_6px_rgba(25,12,3,0.18),1px_0_3px_rgba(25,12,3,0.10)] ring-1 ring-black/8 overflow-hidden relative z-10 book-cover-hover-physics">
        {book.coverUrl && !imageError ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            width={100}
            height={150}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onError={() => setImageError(true)}
            className="w-full h-full block object-cover rounded-[3px] pointer-events-none select-none"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none"
            style={{ backgroundColor: palette?.bg ?? '#A68C75', color: palette?.text ?? '#221E1B' }}
          >
            <span className="text-[11px] font-bold leading-tight line-clamp-4">
              {book.title}
            </span>
            {volumeNumber && (
              <span className="text-[9.5px] font-medium opacity-80 mt-1">
                Vol. {volumeNumber}
              </span>
            )}
          </div>
        )}

        <div className="absolute inset-y-0 left-0 w-2 pointer-events-none bg-linear-to-r from-white/25 via-white/8 to-transparent z-15" />

        {book.status === 'reading' && (
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-black/40 z-20 overflow-hidden">
            <div
              className="h-full bg-amber-400"
              style={{
                width: `${(() => {
                  const seriesTotal =
                    book.totalVolumes && book.totalVolumes > 0
                      ? book.totalVolumes
                      : undefined;
                  return seriesTotal && seriesTotal > 0
                    ? Math.min(100, Math.max(12, Math.round(((book.volume || 1) / seriesTotal) * 100)))
                    : (book.chapter ? 40 : 25);
                })()}%`,
              }}
            />
          </div>
        )}

        {!onHoverBook && (
          <div className="absolute top-1.5 left-1.5 max-w-[calc(100%-12px)] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
            <span className="block bg-black/80 backdrop-blur-xs text-white text-[9.5px] font-sans font-medium px-1.5 py-0.5 rounded-xs leading-tight shadow-xs border border-white/15 truncate">
              {displayTitle} {volumeNumber ? `• Vol. ${volumeNumber}` : ''}
            </span>
          </div>
        )}
      </div>
    </article>
  );
});
