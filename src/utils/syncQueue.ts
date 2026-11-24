import type { BookStatus } from '../types/book';

export interface SyncPayload {
  status?: BookStatus;
  rawAniListStatus?: string;
  volume?: number;
  progressVolumes?: number;
  chapter?: number;
  volumesOwned?: number;
}

export interface SyncQueueOptions {
  debounceMs?: number;
  onSync: (mediaId: number, payload: SyncPayload) => Promise<void>;
  onStatusChange?: (
    bookId: string,
    status: 'idle' | 'syncing' | 'synced' | 'error',
    error?: string
  ) => void;
}

export class SyncQueue {
  private inFlight = new Set<string>();
  private pending = new Map<string, SyncPayload>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private debounceMs: number;
  private onSync: (mediaId: number, payload: SyncPayload) => Promise<void>;
  private onStatusChange?: (
    bookId: string,
    status: 'idle' | 'syncing' | 'synced' | 'error',
    error?: string
  ) => void;

  constructor(options: SyncQueueOptions) {
    this.debounceMs = options.debounceMs ?? 250;
    this.onSync = options.onSync;
    this.onStatusChange = options.onStatusChange;
  }

  enqueue(bookId: string, mediaId: number, payload: SyncPayload, immediate = false): void {
    // Merge into any pending payload for this book
    const existing = this.pending.get(bookId) || {};
    this.pending.set(bookId, { ...existing, ...payload });
    this.onStatusChange?.(bookId, 'syncing');

    // If already in flight, the pending payload will be processed when the current request completes
    if (this.inFlight.has(bookId)) {
      return;
    }

    if (immediate || this.debounceMs <= 0) {
      this.clearTimer(bookId);
      void this.flush(bookId, mediaId);
    } else {
      this.clearTimer(bookId);
      const timer = setTimeout(() => {
        this.timers.delete(bookId);
        void this.flush(bookId, mediaId);
      }, this.debounceMs);
      this.timers.set(bookId, timer);
    }
  }

  private clearTimer(bookId: string): void {
    const timer = this.timers.get(bookId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(bookId);
    }
  }

  private async flush(bookId: string, mediaId: number): Promise<void> {
    if (this.inFlight.has(bookId)) return;
    this.inFlight.add(bookId);

    try {
      while (this.pending.has(bookId)) {
        this.clearTimer(bookId);
        const payloadToSend = this.pending.get(bookId)!;
        this.pending.delete(bookId);

        try {
          await this.onSync(mediaId, payloadToSend);
          if (!this.pending.has(bookId)) {
            this.onStatusChange?.(bookId, 'synced');
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to sync with AniList';
          this.onStatusChange?.(bookId, 'error', message);
          this.pending.delete(bookId);
          break;
        }
      }
    } finally {
      this.inFlight.delete(bookId);
      if (this.pending.has(bookId) && !this.timers.has(bookId)) {
        void this.flush(bookId, mediaId);
      }
    }
  }

  cancel(bookId: string): void {
    this.clearTimer(bookId);
    this.pending.delete(bookId);
    this.inFlight.delete(bookId);
    this.onStatusChange?.(bookId, 'idle');
  }

  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.pending.clear();
    this.inFlight.clear();
  }

  isInFlight(bookId: string): boolean {
    return this.inFlight.has(bookId);
  }

  hasPending(bookId: string): boolean {
    return this.pending.has(bookId);
  }

  getPending(bookId: string): SyncPayload | undefined {
    return this.pending.get(bookId);
  }
}
