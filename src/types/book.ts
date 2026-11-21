export type ShelfDisplayMode = 'full-cover' | 'full-spine';
export type BookStatus = 'reading' | 'finished' | 'want-to-read' | 'on-hold' | 'none';
export type StatusFilter = BookStatus | 'all';
export type SortOption = 'recent' | 'title-asc' | 'title-desc' | 'color' | 'custom';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string[];
  status?: BookStatus;
  coverUrl: string;
  spineColor?: string;
  spineImageUrl?: string;
  releaseDate?: string;
  createdAt?: string;
  description?: string;
  volume?: number;
  volumesOwned?: number;
  ownedVolumes?: number[];
  readVolumes?: number[]; 
  totalVolumes?: number;
  chapter?: number;
}
