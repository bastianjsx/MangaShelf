import { useState, useRef, useCallback } from 'react';
import type { SortOption } from '../../types/book';
import { useDismiss } from '../../hooks/useDismiss';

interface SortDropdownProps {
  sortBy: SortOption;
  onSelectSort: (option: SortOption) => void;
}

const SORT_OPTIONS: { id: SortOption; label: string; shortLabel: string }[] = [
  { id: 'recent', label: 'Recently Added', shortLabel: 'Recent' },
  { id: 'title-asc', label: 'Title (A–Z)', shortLabel: 'A–Z' },
  { id: 'title-desc', label: 'Title (Z–A)', shortLabel: 'Z–A' },
  { id: 'color', label: 'Spine Color', shortLabel: 'Color' },
  { id: 'custom', label: 'Custom', shortLabel: 'Custom' },
];

export function SortDropdown({ sortBy, onSelectSort }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const handleClose = useCallback(() => setIsOpen(false), []);

  useDismiss(dropdownRef, handleClose, isOpen);

  const activeOption = SORT_OPTIONS.find((opt) => opt.id === sortBy) ?? SORT_OPTIONS[0];
  const isCustomSort = sortBy !== 'title-asc' && sortBy !== 'recent';

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = dropdownRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
    if (!items || items.length === 0) return;
    const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerButtonRef.current?.focus();
    }
  };

  return (
    <div className="relative inline-block text-left z-40" ref={dropdownRef}>
      <button
        ref={triggerButtonRef}
        type="button"
        className={`inline-flex items-center gap-1.5 h-7 px-2.5 sm:px-3 rounded-[9px] text-[12px] leading-none cursor-pointer select-none transition-all duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5828] focus-visible:ring-offset-1 ${
          isCustomSort
            ? 'bg-[#7A4518] text-white border border-[#5E320D] shadow-xs ring-2 ring-[#7A4518]/25 font-bold'
            : 'bg-pill-bg border border-pill-border text-[#4A3B30] font-semibold hover:bg-pill-hover-bg hover:text-text-primary'
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Sort books. Currently sorted by ${activeOption.label}`}
        title={`Sort books (Currently: ${activeOption.label})`}
      >
        <svg
          className="w-3.5 h-3.5 shrink-0 opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 16 4 4 4-4" />
          <path d="M7 20V4" />
          <path d="m21 8-4-4-4 4" />
          <path d="M17 4v16" />
        </svg>

        <span className="hidden md:inline text-[11.5px] font-semibold">Sort: {activeOption.shortLabel}</span>
        <span className="md:hidden text-[11.5px] font-semibold">Sort</span>

        <svg
          className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          } ${isCustomSort ? 'text-white/80' : 'text-[#8C5828]'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Sort options"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-[#FFFDF9] border border-shell-border shadow-[0_20px_48px_rgba(45,25,10,0.28),0_4px_12px_rgba(0,0,0,0.1)] p-3 z-100 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-guide-line">
            <span className="font-bold text-[12px] text-text-primary">
              Sort by
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            {SORT_OPTIONS.map((option) => {
              const isSelected = option.id === sortBy;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    onSelectSort(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11.5px] leading-tight text-left transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#F2E5D3] text-text-primary font-semibold'
                      : 'text-[#3A2C23] hover:bg-pill-hover-bg/60 font-medium'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <svg
                      className="w-3.5 h-3.5 text-[#7A4518] shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
