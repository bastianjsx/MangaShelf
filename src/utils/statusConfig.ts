import type { BookStatus, StatusFilter } from '../types/book';

export interface StatusMeta {
  id: Exclude<BookStatus, 'none'>;
  label: string;
  dotClass: string;
  pillClass: string;
}

export const STATUS_CONFIG: Record<Exclude<BookStatus, 'none'>, StatusMeta> = {
  reading: {
    id: 'reading',
    label: 'Reading',
    dotClass: 'bg-amber-500',
    pillClass: 'bg-[#FBF3E4] text-[#8C5828] border-[#E7D4B5]',
  },
  finished: {
    id: 'finished',
    label: 'Finished',
    dotClass: 'bg-emerald-600',
    pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  'want-to-read': {
    id: 'want-to-read',
    label: 'Want to Read',
    dotClass: 'bg-sky-500',
    pillClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  'on-hold': {
    id: 'on-hold',
    label: 'On Hold',
    dotClass: 'bg-stone-400',
    pillClass: 'bg-stone-100 text-stone-700 border-stone-200',
  },
};

export const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: STATUS_CONFIG.reading.label },
  { id: 'finished', label: STATUS_CONFIG.finished.label },
  { id: 'want-to-read', label: STATUS_CONFIG['want-to-read'].label },
  { id: 'on-hold', label: STATUS_CONFIG['on-hold'].label },
];

export const STATUS_LABEL_MAP: Record<Exclude<StatusFilter, 'all' | 'none'>, string> = {
  reading: STATUS_CONFIG.reading.label,
  finished: STATUS_CONFIG.finished.label,
  'want-to-read': STATUS_CONFIG['want-to-read'].label,
  'on-hold': STATUS_CONFIG['on-hold'].label,
};
