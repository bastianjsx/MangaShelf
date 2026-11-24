import { useState, useEffect, useMemo } from 'react';

interface VolumePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOwnedVolumes: number[];
  initialReadVolumes: number[];
  totalAvailableVolumes: number;
  hasUnknownTotalVolumes?: boolean;
  onSave: (ownedVolumes: number[], readVolumes: number[]) => void;
}

export function VolumePickerModal({
  isOpen,
  onClose,
  initialOwnedVolumes,
  initialReadVolumes,
  totalAvailableVolumes,
  hasUnknownTotalVolumes = false,
  onSave,
}: VolumePickerModalProps) {
  const [tempOwnedVolumes, setTempOwnedVolumes] = useState<Set<number>>(() => new Set(initialOwnedVolumes));
  const [tempReadVolumes, setTempReadVolumes] = useState<Set<number>>(() => new Set(initialReadVolumes));
  const [volumeFilter, setVolumeFilter] = useState<'all' | 'owned' | 'read'>('all');
  const [extraCount, setExtraCount] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const effectiveTotalVolumes = totalAvailableVolumes + extraCount;

  const displayedVolumes = useMemo(() => {
    if (volumeFilter === 'owned') {
      return Array.from(tempOwnedVolumes).sort((a, b) => a - b);
    }
    if (volumeFilter === 'read') {
      return Array.from(tempReadVolumes).sort((a, b) => a - b);
    }
    return Array.from({ length: effectiveTotalVolumes }, (_, i) => i + 1);
  }, [volumeFilter, tempOwnedVolumes, tempReadVolumes, effectiveTotalVolumes]);

  const handleToggleVolumeState = (volNum: number) => {
    const isRead = tempReadVolumes.has(volNum);
    const isOwned = tempOwnedVolumes.has(volNum);

    if (isRead) {
      setTempReadVolumes((prev) => {
        const next = new Set(prev);
        next.delete(volNum);
        return next;
      });
      setTempOwnedVolumes((prev) => {
        const next = new Set(prev);
        next.delete(volNum);
        return next;
      });
    } else if (isOwned) {
      setTempReadVolumes((prev) => new Set(prev).add(volNum));
    } else {
      setTempOwnedVolumes((prev) => new Set(prev).add(volNum));
    }
  };

  const handleSelectAllOwned = () => {
    const allVols = new Set<number>();
    for (let i = 1; i <= effectiveTotalVolumes; i++) {
      allVols.add(i);
    }
    setTempOwnedVolumes(allVols);
  };

  const handleClearVolumes = () => {
    setTempOwnedVolumes(new Set());
    setTempReadVolumes(new Set());
  };

  const handleSave = () => {
    const sortedOwned = Array.from(tempOwnedVolumes).sort((a, b) => a - b);
    const sortedRead = Array.from(tempReadVolumes)
      .filter((v) => tempOwnedVolumes.has(v))
      .sort((a, b) => a - b);

    onSave(sortedOwned, sortedRead);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-labelledby="volume-picker-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-[#FAF6F0] border border-[#E4DDD3] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 py-3.5 border-b border-[#EAE3D8] shrink-0 flex items-center justify-between bg-[#FAF6F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0E8DC] border border-[#E2DBD0] flex items-center justify-center text-[#A84300] shrink-0">
              <svg
                className="w-4.5 h-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3
              id="volume-picker-title"
              className="font-sans font-bold text-base text-[#2A2622] leading-tight"
            >
              Select Volumes
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full text-[#3A2C23] hover:text-black hover:bg-[#EAE1D3] flex items-center justify-center transition-colors cursor-pointer text-sm font-bold shrink-0"
            title="Close dialog"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="px-4 sm:px-5 py-3 border-b border-[#EAE3D8] shrink-0 flex items-center justify-between gap-3 flex-wrap bg-[#FAF6F0]">
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#EFE9DF] border border-[#E2DBD0]">
            <button
              type="button"
              onClick={() => setVolumeFilter('all')}
              className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer select-none ${
                volumeFilter === 'all'
                  ? 'bg-white text-[#2A2622] font-bold shadow-2xs'
                  : 'text-[#6E675F] hover:text-[#2A2622] font-medium'
              }`}
              title={`Show all volumes (${effectiveTotalVolumes})`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setVolumeFilter('owned')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer select-none ${
                volumeFilter === 'owned'
                  ? 'bg-white text-[#2A2622] font-bold shadow-2xs'
                  : 'text-[#6E675F] hover:text-[#2A2622] font-medium'
              }`}
              title={`Filter to owned volumes only (${tempOwnedVolumes.size})`}
            >
              <span className="w-2 h-2 rounded-full bg-[#A84300] shrink-0" />
              <span>Owned</span>
              <span className="font-bold text-[#A84300]">
                {tempOwnedVolumes.size}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVolumeFilter('read')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer select-none ${
                volumeFilter === 'read'
                  ? 'bg-white text-[#2A2622] font-bold shadow-2xs'
                  : 'text-[#6E675F] hover:text-[#2A2622] font-medium'
              }`}
              title={`Filter to read volumes only (${tempReadVolumes.size})`}
            >
              <span className="w-2 h-2 rounded-full bg-[#047857] shrink-0" />
              <span>Read</span>
              <span className="font-bold text-[#047857]">
                {tempReadVolumes.size}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0 select-none">
            <button
              type="button"
              onClick={handleSelectAllOwned}
              className="text-xs font-semibold text-[#7A7269] hover:text-[#2A2622] hover:underline cursor-pointer select-none transition-colors"
            >
              Select all
            </button>
            <span className="text-[#D0C7BA]">•</span>
            <button
              type="button"
              onClick={handleClearVolumes}
              className="text-xs font-medium text-[#7A7269] hover:text-[#2A2622] hover:underline cursor-pointer select-none transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-40 max-h-[55vh] overflow-y-auto px-4 sm:px-5 py-3 select-none scrollbar-thin [scrollbar-color:#CBBDAF_transparent]">
          {displayedVolumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-xs font-medium text-[#8C8377] italic">
                No {volumeFilter === 'owned' ? 'owned' : 'read'} volumes yet.
              </span>
              <button
                type="button"
                onClick={() => setVolumeFilter('all')}
                className="mt-2 text-xs font-semibold text-[#7A4518] hover:underline cursor-pointer"
              >
                View all volumes
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pb-2">
                {displayedVolumes.map((volNum) => {
                  const isRead = tempReadVolumes.has(volNum);
                  const isOwned = tempOwnedVolumes.has(volNum);
                  const statusLabel = isRead ? 'Read' : isOwned ? 'Owned' : 'Unread';

                  const tileClass = isRead
                    ? 'bg-[#047857] text-white border border-[#036046] shadow-2xs'
                    : isOwned
                      ? 'bg-[#A84300] text-white border border-[#8F3900] shadow-2xs'
                      : 'bg-[#F7F2EA] text-[#332A24] font-bold border border-[#D5C7B7] shadow-2xs hover:bg-[#EFE8DD] hover:border-[#C4B3A0]';

                  return (
                    <button
                      key={volNum}
                      type="button"
                      onClick={() => handleToggleVolumeState(volNum)}
                      className={`h-10 rounded-[10px] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer select-none relative active:scale-[0.96] hover:-translate-y-0.5 ${tileClass}`}
                      title={`Volume ${volNum} (${statusLabel})`}
                      aria-label={`Volume ${volNum}, ${statusLabel}`}
                    >
                      {volNum}
                      {isRead && (
                        <span className="absolute top-1 right-1 text-[9px] font-bold leading-none text-emerald-200">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasUnknownTotalVolumes && volumeFilter === 'all' && (
                <div className="pt-3 pb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setExtraCount((prev) => prev + 10)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#EFE8DD] hover:bg-[#E5DCCF] border border-[#D5C7B7] text-[#5C4D3C] text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-95"
                  >
                    Add 10 More Volumes
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 sm:p-5 pt-3.5 pb-3.5 border-t border-[#EAE3D8] shrink-0 flex items-center justify-between bg-[#FAF6F0]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-[#E2DBD0] bg-white/70 hover:bg-stone-100 text-[#5C554E] text-xs font-semibold transition-colors cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-9 px-5 rounded-xl bg-[#7A4518] hover:bg-[#63350F] border border-[#5E320D] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer select-none"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
