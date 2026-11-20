import { useState, useRef, useEffect, useMemo } from 'react';

interface CategoryDropdownProps {
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  categoryCounts?: Record<string, number>;
}

export function CategoryDropdown({
  categories,
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  onClearAll,
  categoryCounts = {},
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const allSelected = categories.length > 0 && selectedCategories.length === categories.length;
  const hasSelection = selectedCategories.length > 0;

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [categories]
  );

  return (
    <div className="relative inline-block text-left z-40" ref={dropdownRef}>
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 h-7 px-2.5 sm:px-3 rounded-[9px] text-[12px] leading-none cursor-pointer select-none transition-all duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5828] focus-visible:ring-offset-1 ${
          hasSelection
            ? 'bg-[#7A4518] text-white border border-[#5E320D] shadow-xs ring-2 ring-[#7A4518]/25 font-bold'
            : 'bg-pill-bg border border-pill-border text-[#4A3B30] font-semibold hover:bg-pill-hover-bg hover:text-text-primary'
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Filter collection by genre"
        title={
          hasSelection
            ? `Filter by genre (${selectedCategories.join(', ')})`
            : 'Filter by genre'
        }
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>

        <span className="text-[11.5px] font-semibold">Filter</span>

        {hasSelection && (
          <span className="w-4 h-4 rounded-full bg-white text-[#7A4518] text-[9.5px] font-black flex items-center justify-center leading-none shadow-2xs">
            {selectedCategories.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-68 sm:w-72 rounded-xl bg-[#FFFDF9] border border-shell-border shadow-[0_20px_48px_rgba(45,25,10,0.28),0_4px_12px_rgba(0,0,0,0.1)] p-3 z-100 animate-in fade-in zoom-in-95 duration-100"
          role="dialog"
          aria-label="Genre filter options"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-guide-line text-[11px] text-text-secondary">
            <span className="font-bold text-[12px] text-text-primary">
              Filter by Genre
            </span>
            <button
              type="button"
              className="text-[#8C5828] hover:text-text-primary font-medium cursor-pointer underline text-[11px]"
              onClick={allSelected ? onClearAll : onSelectAll}
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5 pr-1">
            {sortedCategories.map((category) => {
              const isChecked = selectedCategories.includes(category);
              const count = categoryCounts[category];

              return (
                <div
                  key={category}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11.5px] select-none transition-colors ${
                    isChecked
                      ? 'bg-[#F2E5D3] text-text-primary font-semibold'
                      : 'text-[#3A2C23] hover:bg-pill-hover-bg/60'
                  }`}
                >
                  <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCategory(category)}
                      className="w-3.5 h-3.5 rounded accent-[#8C5828] cursor-pointer"
                    />
                    <span className="truncate">{category}</span>
                  </label>
                  {count !== undefined && (
                    <span className="text-[10.5px] text-text-secondary font-medium shrink-0 pl-1.5">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
