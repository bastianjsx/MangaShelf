export type ShelfDisplayMode = 'full-cover' | 'full-spine';
export type BookStatus = 'reading' | 'finished' | 'want-to-read' | 'on-hold' | 'none';
export type FilterableStatus = Exclude<BookStatus, 'none'>;
export type StatusFilter = 'all' | FilterableStatus;
export type SortOption = 'recent' | 'title-asc' | 'title-desc' | 'color' | 'custom';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string[];
  status?: BookStatus;
  rawAniListStatus?: string;
  coverUrl: string;
  spineColor?: string;
  releaseDate?: string;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string;
  description?: string;
  volume?: number;
  volumesOwned?: number;
  ownedVolumes?: number[];
  readVolumes?: number[]; 
  totalVolumes?: number;
  chapter?: number;
}
