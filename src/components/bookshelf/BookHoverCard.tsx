import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from '@floating-ui/react';
import type { Book, ShelfDisplayMode } from '../../types/book';
import { getSpinePalette, getBookOwnedVolumes, getVolumeStatus } from '../../utils/spineUtils';
import { STATUS_CONFIG } from '../../utils/statusConfig';

export interface HoveredBookState {
  book: Book;
  volumeNumber?: number;
  titleIndex?: number;
  targetEl: HTMLElement;
  shelfMode: ShelfDisplayMode;
}

const HOVER_CARD_WIDTH = 248;

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

export function BookHoverCard({ hovered }: { hovered: HoveredBookState }) {
  const {
    refs: { setFloating: setFloatingRef },
    floatingStyles,
  } = useFloating({
    elements: {
      reference: hovered.targetEl,
    },
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ['bottom', 'top-start', 'top-end'], padding: 12 }),
      shift({ padding: 12 }),
    ],
  });

  const { book, volumeNumber } = hovered;
  const [imgFailed, setImgFailed] = useState(false);
  const derivedStatus =
    volumeNumber != null
      ? getVolumeStatus(book, volumeNumber)
      : book.status && book.status !== 'none'
        ? book.status
        : null;
  const statusInfo = derivedStatus ? STATUS_CONFIG[derivedStatus] : null;
  const volLabel =
    volumeNumber != null ? `Vol. ${volumeNumber}` : formatHoverVolumeLabel(book);
  const palette = getSpinePalette(book, hovered.titleIndex, undefined, hovered.volumeNumber);

  return (
    <FloatingPortal>
      <div
        ref={setFloatingRef}
        style={floatingStyles}
        className="z-100 pointer-events-none"
        role="tooltip"
      >
        <div
          className="bg-[#FFFDF9] border border-[#E5D8C5] rounded-xl p-2.5 shadow-[0_14px_30px_rgba(45,25,10,0.22),0_4px_10px_rgba(0,0,0,0.08)] flex items-center gap-3 animate-in fade-in zoom-in-95 duration-100"
          style={{ width: `${HOVER_CARD_WIDTH}px` }}
        >
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
    </FloatingPortal>
  );
}
