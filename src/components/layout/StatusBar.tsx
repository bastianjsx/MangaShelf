import type { StatusFilter } from '../../types/book';
import { STATUS_OPTIONS } from '../../utils/statusConfig';

export type { StatusFilter };

interface StatusBarProps {
  activeStatus: StatusFilter;
  onSelectStatus: (status: StatusFilter) => void;
  statusCounts?: Record<string, number>;
}

export function StatusBar({
  activeStatus,
  onSelectStatus,
  statusCounts = {},
}: StatusBarProps) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto [scrollbar-none] py-1"
      role="tablist"
      aria-label="Filter bookshelf by status"
    >
      {STATUS_OPTIONS.map((option) => {
        const isActive = activeStatus === option.id;
        const count = statusCounts[option.id] ?? 0;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() =>
              onSelectStatus(isActive && option.id !== 'all' ? 'all' : option.id)
            }
            className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] leading-none cursor-pointer select-none shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5828] focus-visible:ring-offset-1 ${
              isActive
                ? 'bg-[#7A4518] border border-[#5E320D] text-white font-bold shadow-xs ring-2 ring-[#7A4518]/25'
                : 'bg-pill-bg border border-pill-border text-[#4A3B30] font-medium hover:bg-pill-hover-bg hover:text-text-primary'
            }`}
          >
            <span>{option.label}</span>

            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : count > 0
                    ? 'bg-pill-border/60 text-[#3A2B20]'
                    : 'bg-pill-border/30 text-[#8C7B6D]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
