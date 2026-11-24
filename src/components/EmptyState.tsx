import type { StatusFilter } from '../types/book';

interface EmptyStateProps {
  onClearFilter?: () => void;
  activeStatus?: StatusFilter;
}

export function EmptyState({ onClearFilter, activeStatus }: EmptyStateProps) {
  let title = 'No matching books found';
  let message = 'There are currently no books in your list matching the selected filters.';

  if (activeStatus === 'finished') {
    title = 'Nothing finished yet';
    message = 'Mark a title as finished to see it here on your shelf.';
  } else if (activeStatus === 'on-hold') {
    title = 'No titles on hold';
    message = 'Titles you pause or place on hold will appear here.';
  } else if (activeStatus === 'reading') {
    title = 'No titles currently being read';
    message = 'Start reading a volume or mark a title as reading to see it here.';
  } else if (activeStatus === 'want-to-read') {
    title = 'No titles in Want to Read';
    message = 'Add manga to your want-to-read list to see them here.';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 py-14 px-6 text-center flex flex-col items-center justify-center"
    >
      <p className="font-sans text-[20px] md:text-[22px] font-semibold text-text-primary mb-2">
        {title}
      </p>
      <p className="text-[13.5px] text-text-secondary mb-5 max-w-md">
        {message}
      </p>
      {onClearFilter && (
        <button
          type="button"
          onClick={onClearFilter}
          className="h-8 px-4 bg-pill-bg border border-pill-border rounded-full text-[12px] font-semibold text-text-primary hover:bg-pill-hover-bg focus-visible:outline-2 focus-visible:outline-plank-edge focus-visible:outline-offset-2 transition-all cursor-pointer shadow-2xs"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
