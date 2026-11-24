import { memo } from 'react';
import { motion } from 'motion/react';
import { type Book } from '../../types/book';
import {
  getSpinePalette,
  getSpineFormat,
  getSpineVolumeInfo,
  getSpineDisplayTitle,
} from '../../utils/spineUtils';

interface BookSpineProps {
  book: Book;
  volumeNumber?: number;
  titleIndex?: number;
  onSelectBook?: (book: Book) => void;
  onHoverBook?: (
    book: Book,
    volumeNumber: number | undefined,
    element: HTMLElement,
    titleIndex?: number
  ) => void;
  onLeaveBook?: () => void;
}

export const BookSpine = memo(function BookSpine({
  book,
  volumeNumber,
  titleIndex,
  onSelectBook,
  onHoverBook,
  onLeaveBook,
}: BookSpineProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectBook?.(book);
  };

  const palette = getSpinePalette(book, titleIndex, undefined, volumeNumber);
  const format = getSpineFormat(book);
  const volumeInfo = getSpineVolumeInfo(book, volumeNumber);
  const displayTitle = getSpineDisplayTitle(book.title);
  const spineWidth = format.width;

  const inkColor = palette.isLight
    ? (palette.titleColor && palette.titleColor !== '#18181B' && palette.titleColor !== '#1C1917' && palette.titleColor !== '#231F20' ? palette.titleColor : '#221E1B')
    : (palette.titleColor && palette.titleColor !== '#FFFFFF' && palette.titleColor !== '#F8FAFC' ? palette.titleColor : '#F4EFE6');

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    onHoverBook?.(book, volumeNumber, e.currentTarget, titleIndex);
  };

  const handleMouseLeave = () => {
    onLeaveBook?.();
  };

  if (book.spineImageUrl && !volumeNumber) {
    return (
      <motion.article
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectBook?.(book);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        layout="position"
        whileHover={{ y: -8, scale: 1.025 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        className="shrink-0 relative z-10 select-none cursor-pointer group focus-visible:outline-2 focus-visible:outline-plank-edge focus-visible:outline-offset-2 touch-manipulation"
        style={{
          width: `${spineWidth}px`,
          height: `${format.height}px`,
        }}
        aria-label={`${book.title} (${volumeInfo.tooltipText})`}
        title={onHoverBook ? undefined : book.title}
      >
        <div className="absolute -bottom-0.5 inset-x-0.5 h-1 bg-[#2d1204]/35 blur-[1px] rounded-full pointer-events-none z-0 shadow-[0_1.5px_3px_rgba(35,16,4,0.25)] transition-opacity duration-200 group-hover:opacity-20" />
        <div className="w-full h-full rounded-t-xs rounded-b-[1px] relative overflow-hidden shadow-[1px_0_1.5px_rgba(20,8,2,0.18),0_1.5px_3.5px_rgba(25,12,3,0.15)]">
          <img
            src={book.spineImageUrl}
            alt={`Spine of ${book.title}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 manga-spine-paper pointer-events-none z-10" />
          <div className="manga-paper-grain" />
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectBook?.(book);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      layout="position"
      whileHover={{ y: -8, scale: 1.025 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="shrink-0 relative z-10 select-none cursor-pointer group focus-visible:outline-2 focus-visible:outline-plank-edge focus-visible:outline-offset-2 touch-manipulation"
      style={{
        width: `${spineWidth}px`,
        height: `${format.height}px`,
      }}
      aria-label={`${book.title} (${volumeInfo.tooltipText})`}
      title={onHoverBook ? undefined : book.title}
    >
      <div className="absolute -bottom-0.5 inset-x-0.5 h-1 bg-[#2d1204]/35 blur-[1px] rounded-full pointer-events-none z-0 shadow-[0_1.5px_3px_rgba(35,16,4,0.25)] transition-all duration-200 group-hover:opacity-20" />

     
      <div
        className="w-full h-full rounded-t-xs rounded-b-none relative overflow-hidden flex flex-col items-center justify-between pt-2 pb-1.5 px-0.5 shadow-[1px_0_1.5px_rgba(20,8,2,0.18),0_1.5px_3.5px_rgba(25,12,3,0.15)] transition-all duration-200 group-hover:shadow-[0_6px_14px_rgba(25,12,3,0.26)]"
        style={{
          backgroundColor: palette.bg,
          backgroundImage: palette.gradient,
          color: inkColor,
        }}
      >
        <div className="absolute inset-0 manga-spine-overlay pointer-events-none z-10" />

        <div className="manga-paper-grain" />

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center max-h-24 overflow-hidden w-full px-0.5 my-auto">
          <span
            className="manga-vertical-title font-semibold text-[10px] leading-[1.05] tracking-[0.02em] select-none text-center"
            style={{
              color: inkColor,
              whiteSpace: 'nowrap',
              maxHeight: '96px',
            }}
          >
            {displayTitle}
          </span>
        </div>

        <div className="relative z-20 shrink-0 mb-1.5 pt-2 flex flex-col items-center justify-center">
          <div
            className="font-mono font-extrabold text-[9.5px] leading-none tracking-tight select-none"
            style={{
              color: inkColor,
            }}
          >
            {volumeInfo.badgeText}
          </div>
        </div>
      </div>
    </motion.article>
  );
});
