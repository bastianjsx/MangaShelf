import { useState, useRef, useCallback } from 'react';
import type { SortOption, Book, ShelfDisplayMode, StatusFilter } from '../../types/book';
import type { AniListUser } from '../../services/anilistAuth';
import { SortDropdown } from './SortDropdown';
import { CategoryDropdown } from './CategoryDropdown';
import { StatusBar } from './StatusBar';
import { SearchBar } from '../manga/SearchBar';
import { useDismiss } from '../../hooks/useDismiss';

interface HeaderProps {
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onSelectAllCategories: () => void;
  onClearAllCategories: () => void;
  categoryCounts?: Record<string, number>;

  sortBy: SortOption;
  onSelectSort: (option: SortOption) => void;

  shelfMode: ShelfDisplayMode;
  onSelectShelfMode: (mode: ShelfDisplayMode) => void;

  onAddBook: (book: Book) => void;
  existingBookIds: Set<string>;

  activeStatus: StatusFilter;
  onSelectStatus: (status: StatusFilter) => void;
  statusCounts?: Record<string, number>;

  user: AniListUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onSync: () => void;
  isSyncing?: boolean;

  totalBooksCount: number;
}

function AccountDropdown({
  user,
  onLogout,
  onSync,
  isSyncing = false,
}: {
  user: AniListUser;
  onLogout: () => void;
  onSync: () => void;
  isSyncing?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => setIsOpen(false), []);

  useDismiss(menuRef, handleClose, isOpen);

  return (
    <div className="relative inline-block text-left z-50" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${user.name}`}
        title={`Account: ${user.name} (Click for settings, sync, and logout)`}
        className="inline-flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-[9px] text-[12px] font-medium leading-none bg-pill-bg border border-pill-border text-pill-text select-none shrink-0 shadow-xs hover:bg-pill-hover-bg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5828] focus-visible:ring-offset-1"
      >
        {user.avatar?.medium ? (
          <img
            src={user.avatar.medium}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover border border-pill-border"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#02A9FF] text-white flex items-center justify-center text-[11px] font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-[12px] font-semibold text-text-primary max-w-28 truncate">
          {user.name}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
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
          aria-label="User account actions"
          className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-[#FFFDF9] border border-shell-border shadow-[0_20px_48px_rgba(45,25,10,0.28),0_4px_12px_rgba(0,0,0,0.1)] p-2 z-100 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-2 border-b border-guide-line mb-1">
            <div className="text-[12px] font-bold text-text-primary truncate">
              {user.name}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{isSyncing ? 'Syncing library...' : 'Synced 2 min ago'}</span>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={isSyncing}
            onClick={() => {
              onSync();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-text-primary hover:bg-pill-hover-bg/80 transition-colors cursor-pointer select-none text-left focus-visible:outline-none focus-visible:bg-pill-hover-bg"
          >
            <svg
              className={`w-4 h-4 text-[#02A9FF] shrink-0 ${
                isSyncing ? 'animate-spin' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <div className="flex flex-col">
              <span>{isSyncing ? 'Syncing...' : 'Sync Library'}</span>
              <span className="text-[10px] text-text-secondary">
                Two-way sync with AniList
              </span>
            </div>
          </button>

          <div className="h-px bg-guide-line my-1 w-full" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors cursor-pointer select-none text-left focus-visible:outline-none focus-visible:bg-red-50"
          >
            <svg
              className="w-4 h-4 text-red-600 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL_MAP: Record<Exclude<StatusFilter, 'all' | 'none'>, string> = {
  reading: 'Reading',
  finished: 'Finished',
  'want-to-read': 'Want to Read',
  'on-hold': 'On Hold',
};

export function Header({
  categories,
  selectedCategories,
  onToggleCategory,
  onSelectAllCategories,
  onClearAllCategories,
  categoryCounts,
  sortBy,
  onSelectSort,
  shelfMode,
  onSelectShelfMode,
  onAddBook,
  existingBookIds,
  activeStatus,
  onSelectStatus,
  statusCounts,
  user,
  onLoginClick,
  onLogout,
  onSync,
  isSyncing = false,
  totalBooksCount,
}: HeaderProps) {
  const hasActiveFilters =
    selectedCategories.length > 0 || (activeStatus !== 'all' && activeStatus !== 'none');

  return (
    <header className="text-left px-0 pb-5 md:pb-6 relative z-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div>
          <h1 className="font-sans text-[26px] md:text-[30px] font-semibold text-text-primary leading-tight tracking-[-0.3px]">
            My Bookshelf
          </h1>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto relative z-50">
          <div className="w-full sm:w-56 md:w-64 relative z-50">
            <SearchBar onAddBook={onAddBook} existingBookIds={existingBookIds} />
          </div>

          {!user ? (
            <button
              type="button"
              onClick={onLoginClick}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[12px] font-medium leading-none cursor-pointer select-none transition-all duration-150 bg-pill-bg border border-pill-border text-pill-text hover:bg-pill-hover-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5828] focus-visible:ring-offset-1 shrink-0 shadow-xs"
              title="Log in with AniList for two-way sync"
            >
              <svg
                className="w-4 h-4 text-[#02A9FF]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6.361 2.843 0 21.156h6.362l1.693-4.864h5.666l1.692 4.864h6.362L15.414 2.843H6.361zm2.71 8.878 1.83-5.26 1.832 5.26H9.071z" />
              </svg>
              <span className="text-[11.5px] text-text-primary font-medium hidden sm:inline">
                Login with AniList
              </span>
            </button>
          ) : (
            <AccountDropdown
              user={user}
              onLogout={onLogout}
              onSync={onSync}
              isSyncing={isSyncing}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center shrink-0">
            <StatusBar
              activeStatus={activeStatus}
              onSelectStatus={onSelectStatus}
              statusCounts={statusCounts}
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto" role="group">
            <span className="text-[12px] font-semibold text-text-secondary mr-0.5 select-none">
              {shelfMode === 'full-spine'
                ? `${statusCounts?.all ?? totalBooksCount} ${(statusCounts?.all ?? totalBooksCount) === 1 ? 'volume' : 'volumes'}`
                : `${totalBooksCount} ${totalBooksCount === 1 ? 'title' : 'titles'}`}
            </span>

            <SortDropdown sortBy={sortBy} onSelectSort={onSelectSort} />

            <CategoryDropdown
              categories={categories}
              selectedCategories={selectedCategories}
              onToggleCategory={onToggleCategory}
              onSelectAll={onSelectAllCategories}
              onClearAll={onClearAllCategories}
              categoryCounts={categoryCounts}
            />

            <div
              className="inline-flex items-center h-7 p-0.5 rounded-[9px] bg-[#EFE4D2] border border-pill-border shadow-2xs select-none"
              role="radiogroup"
              aria-label="Display mode"
            >
              <button
                type="button"
                onClick={() => onSelectShelfMode('full-cover')}
                className={`inline-flex items-center gap-1.5 h-full px-2.5 rounded-[7px] text-[11px] font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5828] ${
                  shelfMode === 'full-cover'
                    ? 'bg-[#8C5828] text-white font-semibold shadow-xs'
                    : 'text-[#4A3B30] hover:text-text-primary hover:bg-[#E2D4BF]/60'
                }`}
                title="Cover: Display all books as covers"
                aria-checked={shelfMode === 'full-cover'}
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 7h8M8 11h8M8 15h4" />
                </svg>
                <span className="hidden sm:inline">Cover</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectShelfMode('full-spine')}
                className={`inline-flex items-center gap-1.5 h-full px-2.5 rounded-[7px] text-[11px] font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5828] ${
                  shelfMode === 'full-spine'
                    ? 'bg-[#8C5828] text-white font-semibold shadow-xs'
                    : 'text-[#4A3B30] hover:text-text-primary hover:bg-[#E2D4BF]/60'
                }`}
                title="Spine: Display books as spines (double-tap series to collapse into a single cover)"
                aria-checked={shelfMode === 'full-spine'}
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19V5a1 1 0 011-1h3a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
                  <path d="M9 19V5a1 1 0 011-1h3a1 1 0 011 1v14a1 1 0 01-1 1H9a1 1 0 01-1-1z" />
                  <path d="M14 19V5a1 1 0 011-1h3a1 1 0 011 1v14a1 1 0 01-1 1h-3a1 1 0 01-1-1z" />
                </svg>
                <span className="hidden sm:inline">Spine</span>
              </button>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-in fade-in duration-150">
            <span className="text-[11.5px] text-text-secondary font-medium mr-0.5 select-none">
              Filtered by:
            </span>

            {activeStatus !== 'all' && activeStatus !== 'none' && (
              <button
                type="button"
                onClick={() => onSelectStatus('all')}
                className="inline-flex items-center gap-1.5 h-6.5 pl-2.5 pr-2 rounded-full text-[11px] font-semibold bg-[#EDE0CE] border border-[#C8B092] text-[#3D2512] hover:bg-[#E3D1BA] cursor-pointer transition-colors shadow-2xs"
                title={`Remove status filter "${STATUS_LABEL_MAP[activeStatus]}"`}
              >
                <span>Status: {STATUS_LABEL_MAP[activeStatus]}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[10px] leading-none text-[#3D2512]">
                  ✕
                </span>
              </button>
            )}

            {selectedCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onToggleCategory(cat)}
                className="inline-flex items-center gap-1.5 h-6.5 pl-2.5 pr-2 rounded-full text-[11px] font-semibold bg-[#EDE0CE] border border-[#C8B092] text-[#3D2512] hover:bg-[#E3D1BA] cursor-pointer transition-colors shadow-2xs"
                title={`Remove ${cat} genre filter`}
              >
                <span>{cat}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[10px] leading-none text-[#3D2512]">
                  ✕
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
