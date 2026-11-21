import { useState, useEffect, useRef, useCallback } from 'react';
import type { Book } from '../../types/book';
import { searchAniList } from '../../services/anilist';
import { useDismiss } from '../../hooks/useDismiss';

interface SearchBarProps {
  onAddBook: (book: Book) => void | Promise<boolean>;
  existingBookIds: Set<string>;
}

export function SearchBar({ onAddBook, existingBookIds }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => setIsOpen(false), []);

  useDismiss(containerRef, handleClose, isOpen);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const data = await searchAniList(trimmed, 8, controller.signal);
        setResults(data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.error('AniList search failed:', err);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const handleAdd = async (book: Book) => {
    if (addingIds.has(book.id)) return;
    setAddingIds((prev) => new Set(prev).add(book.id));
    try {
      await onAddBook(book);
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(book.id);
        return next;
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSearched(false);
    setLoading(false);
  };

  return (
    <div ref={containerRef} className="relative w-full z-50">
      <div className="relative flex items-center">
        <svg
          className="absolute left-3 w-4 h-4 text-text-secondary pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.trim().length < 2) {
              setResults([]);
              setSearched(false);
              setLoading(false);
              setIsOpen(false);
            } else {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (results.length > 0 || query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          id="manga-search-input"
          placeholder="Search..."
          aria-label="Search"
          className="w-full h-9 pl-9.5 pr-8 rounded-full text-[12.5px] bg-white border border-pill-border text-text-primary placeholder:text-text-secondary/70 shadow-xs hover:border-plank-edge/70 focus:outline-none focus:border-plank-edge focus:ring-2 focus:ring-plank-edge/30 transition-all"
        />

        {loading ? (
          <div className="absolute right-2.5">
            <svg
              className="animate-spin w-3.5 h-3.5 text-text-secondary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 w-4 h-4 flex items-center justify-center text-text-secondary hover:text-text-primary text-xs cursor-pointer rounded-full"
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {isOpen && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute right-0 top-full mt-2 w-full sm:w-88 md:w-96 bg-shell-bg border border-shell-border rounded-xl shadow-[0_20px_48px_rgba(45,25,10,0.28),0_4px_12px_rgba(0,0,0,0.1)] z-100 overflow-hidden">
          {loading && results.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-text-secondary animate-pulse">
              Searching manga...
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-3.5 py-2 bg-stone-100/60 border-b border-guide-line text-[11px] font-medium text-text-secondary flex items-center justify-between">
                <span>Results</span>
                <span className="text-[10px] text-text-secondary/70">Click + to add to shelf</span>
              </div>
              <ul className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-guide-line/50">
                {results.map((book) => {
                  const isAdded = existingBookIds.has(book.id);
                  return (
                    <li
                      key={book.id}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-pill-hover-bg/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt=""
                            className="w-8 h-11 object-cover rounded-xs shadow-2xs shrink-0 bg-stone-200"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-stone-300 rounded-xs flex items-center justify-center text-[9px] text-stone-600 font-bold shrink-0">
                            📖
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-text-primary truncate">
                            {book.title}
                          </h4>
                          <p className="text-[11px] text-text-secondary truncate">
                            {book.author}
                          </p>
                          {book.category.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className="inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#EFE6D8] text-[#5C4D3C] border border-pill-border">
                                {book.category[0]}
                              </span>
                              {book.category[1] && (
                                <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                  {book.category[1]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isAdded ? (
                        <span className="text-[10px] font-semibold text-spine-brown bg-pill-bg px-2 py-1 rounded-md shrink-0">
                          ✓ On Shelf
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(book)}
                          disabled={addingIds.has(book.id)}
                          className="h-7 px-2.5 bg-[#5DB8CD] hover:bg-[#4FA7BC] disabled:opacity-50 text-white text-[11px] font-medium rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          {addingIds.has(book.id) ? (
                            <span>Adding...</span>
                          ) : (
                            <>
                              <span className="font-bold leading-none">+</span>
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : searched ? (
            <div className="py-6 px-4 text-center">
              <p className="text-xs font-medium text-text-primary">No manga found</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                No matching titles found for "{query.trim()}"
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
