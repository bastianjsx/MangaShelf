import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Book, BookStatus } from '../../types/book';
import {
  getSpinePalette,
  getBookOwnedVolumes,
  getBookReadVolumes,
} from '../../utils/spineUtils';
import { VolumePickerModal } from './VolumePickerModal';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onUpdateStatus?: (bookId: string, status: BookStatus) => void;
  onUpdateProgress?: (
    bookId: string,
    progress: {
      volume?: number;
      chapter?: number;
      volumesOwned?: number;
      ownedVolumes?: number[];
      readVolumes?: number[];
    }
  ) => void;
  onDeleteBook?: (bookId: string) => void;
}

export function BookDetailModal({
  book,
  onClose,
  onUpdateStatus,
  onUpdateProgress,
  onDeleteBook,
}: BookDetailModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVolumePickerOpen, setIsVolumePickerOpen] = useState(false);

  const currentOwnedList = useMemo(() => getBookOwnedVolumes(book), [book]);
  const currentReadList = useMemo(() => getBookReadVolumes(book), [book]);
  const spinePalette = useMemo(() => getSpinePalette(book), [book]);

  const volumeProgress = useMemo(() => {
    if (currentReadList.length > 0) {
      return Math.max(...currentReadList);
    }
    return typeof book.volume === 'number' ? book.volume : 0;
  }, [currentReadList, book.volume]);

  const handleAutoUpdateStatus = useCallback(() => {
    if (book.status === 'want-to-read') {
      onUpdateStatus?.(book.id, 'reading');
    }
  }, [book.id, book.status, onUpdateStatus]);

  const handleUpdateVolumeProgress = (newVal: number) => {
    const clamped = Math.max(0, newVal);
    if (clamped > 0) {
      handleAutoUpdateStatus();
    }
    const newRead = clamped > 0 ? Array.from({ length: clamped }, (_, i) => i + 1) : [];
    const ownedSet = new Set(currentOwnedList);
    for (let i = 1; i <= clamped; i++) {
      ownedSet.add(i);
    }
    const newOwned = Array.from(ownedSet).sort((a, b) => a - b);

    onUpdateProgress?.(book.id, {
      volume: clamped,
      readVolumes: newRead,
      ownedVolumes: newOwned,
      volumesOwned: newOwned.length,
    });
  };

  const handleUpdateChapter = (newChapter: number | undefined) => {
    const val = newChapter === undefined ? undefined : Math.max(0, newChapter);
    if (typeof val === 'number' && val > 0) {
      handleAutoUpdateStatus();
    }
    onUpdateProgress?.(book.id, { chapter: val });
  };

  const hasUnknownTotalVolumes = !book.totalVolumes || book.totalVolumes <= 0;

  const totalAvailableVolumes = useMemo(() => {
    if (typeof book.totalVolumes === 'number' && book.totalVolumes > 0) {
      return Math.max(book.totalVolumes, ...currentOwnedList, ...currentReadList);
    }
    const highestOwnedOrRead = Math.max(0, ...currentOwnedList, ...currentReadList, book.volume || 0);
    return Math.max(10, Math.ceil(highestOwnedOrRead / 10) * 10);
  }, [book.totalVolumes, currentOwnedList, currentReadList, book.volume]);

  const ownedPercent = useMemo(
    () => Math.min(100, Math.round((currentOwnedList.length / totalAvailableVolumes) * 100)),
    [currentOwnedList.length, totalAvailableVolumes]
  );

  const openVolumePicker = () => {
    setIsVolumePickerOpen(true);
  };

  const handleSaveVolumePicker = (sortedOwned: number[], sortedRead: number[]) => {
    const maxRead = sortedRead.length > 0 ? Math.max(...sortedRead) : 0;
    if (maxRead > 0) {
      handleAutoUpdateStatus();
    }
    onUpdateProgress?.(book.id, {
      ownedVolumes: sortedOwned,
      readVolumes: sortedRead,
      volume: maxRead,
      volumesOwned: sortedOwned.length,
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isVolumePickerOpen) {
          setIsVolumePickerOpen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [onClose, isVolumePickerOpen]);

  const addedDateStr = book.createdAt
    ? new Date(book.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const primaryCategories = Array.isArray(book.category)
    ? book.category.filter(Boolean)
    : [book.category || 'Uncategorized'];
  const description = book.description?.trim() || '';
  const currentStatus: BookStatus = book.status || 'none';
  const hasImage = Boolean(book.coverUrl) && !imageError;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-labelledby="book-detail-title"
    >
      <div className="relative w-full max-w-3xl bg-shell-bg border border-shell-border rounded-2xl shadow-[0_24px_50px_rgba(45,25,10,0.22),0_4px_12px_rgba(0,0,0,0.08)] flex flex-col md:flex-row overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 rounded-full text-[#3A2C23] hover:text-black hover:bg-[#EAE1D3] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-plank-edge"
          title="Close dialog (Esc)"
          aria-label="Close"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="w-full md:w-5/12 bg-[#FBF9F5] border-b md:border-b-0 md:border-r border-guide-line p-6 flex flex-col items-center justify-center min-h-75 relative">
          <div className="flex items-center justify-center my-auto">
            {hasImage ? (
              <div className="w-44 h-64 max-h-75 rounded-md overflow-hidden shadow-[0_12px_24px_rgba(45,25,10,0.22),0_4px_8px_rgba(30,15,5,0.14)] border border-shell-border/60 bg-white flex items-center justify-center p-0.5">
                <img
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-contain block"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div
                className="w-20 h-64 rounded-t-xs shadow-[0_10px_20px_rgba(45,25,10,0.25)] flex items-center justify-center p-2 relative overflow-hidden select-none border border-black/10"
                style={{
                  backgroundColor: spinePalette.bg,
                  color: spinePalette.text,
                }}
              >
                <div className="absolute inset-0 bg-linear-to-r from-black/25 via-white/16 to-black/25 pointer-events-none" />
                <span
                  className="[writing-mode:vertical-rl] font-sans font-medium uppercase tracking-[0.25em] text-[10px] leading-tight truncate py-2"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {book.title}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h2
              id="book-detail-title"
              className="font-sans text-2xl sm:text-3xl font-bold text-text-primary tracking-tight leading-snug mb-1.5 pr-8"
            >
              {book.title}
            </h2>

            <p className="text-xs text-text-secondary mb-3.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-text-primary">
                {book.author}
              </span>
              {addedDateStr && (
                <>
                  <span className="text-stone-400">•</span>
                  <span>Added {addedDateStr}</span>
                </>
              )}
            </p>

            {description && (
              <div className="text-[13.5px] leading-relaxed text-text-primary mb-4">
                <p>
                  {isExpanded || description.length <= 180
                    ? description
                    : `${description.slice(0, 180)}...`}
                </p>
                {description.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="text-stone-700 hover:text-text-primary font-semibold text-xs cursor-pointer mt-1 underline"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
              <span className="text-xs font-medium text-text-secondary">Category:</span>
              {primaryCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFE6D8] text-[#5C4D3C] border border-pill-border"
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-1 mb-3.5 w-44">
              <label
                htmlFor="book-status-select"
                className="text-xs font-medium text-text-secondary"
              >
                Status
              </label>
              <div className="relative inline-flex items-center">
                <select
                  id="book-status-select"
                  value={currentStatus}
                  onChange={(e) => {
                    onUpdateStatus?.(book.id, e.target.value as BookStatus);
                  }}
                  className="w-full h-8 pl-3 pr-8 rounded-lg text-xs font-medium bg-[#EFE6D8] text-[#5C4D3C] border border-pill-border cursor-pointer appearance-none focus:outline-none focus:border-plank-edge focus:ring-1 focus:ring-plank-edge/50 transition-colors"
                >
                  <option value="none">No status</option>
                  <option value="reading">Reading</option>
                  <option value="finished">Finished</option>
                  <option value="want-to-read">Want to read</option>
                  <option value="on-hold">On hold</option>
                </select>
                <svg
                  className="w-3.5 h-3.5 text-[#5C4D3C] absolute right-2.5 pointer-events-none"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-text-primary">
                  Volume Progress
                </span>
                <span className="text-xs font-medium text-[#6E675F] truncate flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#E0A96D] inline-block shrink-0" />
                    <span>{currentOwnedList.length}/{totalAvailableVolumes} Owned</span>
                  </span>
                </span>
              </div>

              <div className="relative w-full h-1.5 bg-[#E5DDD2] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[#E0A96D] rounded-full transition-all duration-300"
                  style={{ width: `${ownedPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-xs font-semibold text-[#6E675F]">
                      Volumes
                    </span>
                    <button
                      type="button"
                      onClick={openVolumePicker}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5ECE0] text-[#7A4518] border border-[#DFCBB5] hover:bg-[#EFE2D2] hover:border-[#CBAF94] hover:text-[#5E320D] transition-all cursor-pointer select-none shadow-2xs"
                      title="Edit owned and read volumes"
                    >
                      <svg
                        className="w-2.5 h-2.5 text-[#7A4518]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="h-8 rounded-[9px] bg-[#FCF9F5] border border-[#E2DBD0] flex items-center justify-between px-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateVolumeProgress(volumeProgress - 1)}
                      disabled={volumeProgress <= 0}
                      className="w-6.5 h-6.5 rounded-md flex items-center justify-center text-[#6E675F] hover:text-text-primary hover:bg-[#F0EAE1] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer text-sm font-bold select-none"
                      title="Decrease volume"
                      aria-label="Decrease volume"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={volumeProgress}
                      onChange={(e) => {
                        const val =
                          e.target.value === ''
                            ? 0
                            : parseInt(e.target.value, 10) || 0;
                        handleUpdateVolumeProgress(val);
                      }}
                      className="flex-1 min-w-0 h-full text-center text-xs font-bold text-text-primary bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Volume progress"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateVolumeProgress(volumeProgress + 1)}
                      className="w-6.5 h-6.5 rounded-md flex items-center justify-center text-[#6E675F] hover:text-text-primary hover:bg-[#F0EAE1] transition-colors cursor-pointer text-sm font-bold select-none"
                      title="Increase volume"
                      aria-label="Increase volume"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-xs font-semibold text-[#6E675F]">
                      Chapter
                    </span>
                  </div>

                  <div className="h-8 rounded-[9px] bg-[#FCF9F5] border border-[#E2DBD0] flex items-center justify-between px-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateChapter((book.chapter ?? 0) - 1)}
                      disabled={(book.chapter ?? 0) <= 0}
                      className="w-6.5 h-6.5 rounded-md flex items-center justify-center text-[#6E675F] hover:text-text-primary hover:bg-[#F0EAE1] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer text-sm font-bold select-none"
                      title="Decrease chapter"
                      aria-label="Decrease chapter"
                    >
                      −
                    </button>
                    <input
                      id="book-chapter-input"
                      type="number"
                      min={0}
                      max={9999}
                      value={book.chapter ?? 0}
                      onChange={(e) => {
                        const val =
                          e.target.value === ''
                            ? undefined
                            : Math.max(0, parseInt(e.target.value, 10) || 0);
                        handleUpdateChapter(val);
                      }}
                      className="flex-1 min-w-0 h-full text-center text-xs font-bold text-text-primary bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Chapter progress"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateChapter((book.chapter ?? 0) + 1)}
                      className="w-6.5 h-6.5 rounded-md flex items-center justify-center text-[#6E675F] hover:text-text-primary hover:bg-[#F0EAE1] transition-colors cursor-pointer text-sm font-bold select-none"
                      title="Increase chapter"
                      aria-label="Increase chapter"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {onDeleteBook && (
              <div className="flex items-center justify-start pt-3 mt-4 border-t border-guide-line/60">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 py-1 px-0.5 text-xs font-medium text-[#8C8377] hover:text-rose-600 transition-colors cursor-pointer select-none group"
                  onClick={() => {
                    if (confirm(`Remove "${book.title}" from your bookshelf?`)) {
                      onDeleteBook(book.id);
                    }
                  }}
                  title={`Remove "${book.title}" from shelf`}
                >
                  <svg
                    className="w-3.5 h-3.5 text-[#8C8377] group-hover:text-rose-600 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Remove from shelf</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isVolumePickerOpen && (
        <VolumePickerModal
          isOpen={isVolumePickerOpen}
          onClose={() => setIsVolumePickerOpen(false)}
          initialOwnedVolumes={currentOwnedList}
          initialReadVolumes={currentReadList}
          totalAvailableVolumes={totalAvailableVolumes}
          hasUnknownTotalVolumes={hasUnknownTotalVolumes}
          onSave={handleSaveVolumePicker}
        />
      )}
    </div>
  );
}
