import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLastAniListSyncTime,
  setLastAniListSyncTime,
  clearAniListAuth,
  LAST_SYNC_STORAGE_KEY,
  BOOK_STATUS_TO_ANILIST_STATUS,
  ANILIST_STATUS_TO_BOOK_STATUS,
  ANILIST_AUTH_CLEARED_EVENT,
  AUTO_SYNC_INTERVAL_MS,
  isSyncDue,
} from './anilistAuth.ts';

// Mock localStorage in Node environment if needed
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

if (typeof window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: new EventTarget(),
    writable: true,
  });
}

describe('aniListAutoSync', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it('verifies 1-day duration constant is 86,400,000 ms', () => {
    assert.strictEqual(AUTO_SYNC_INTERVAL_MS, 24 * 60 * 60 * 1000);
  });

  it('reads and writes last sync time correctly', () => {
    assert.strictEqual(getLastAniListSyncTime(), null);

    const now = Date.now();
    setLastAniListSyncTime(now);
    assert.strictEqual(getLastAniListSyncTime(), now);
  });

  it('determines whether sync is due using production isSyncDue', () => {
    const now = Date.now();
    assert.strictEqual(isSyncDue(null, now), true);

    // 12 hours ago: not due
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
    assert.strictEqual(isSyncDue(twelveHoursAgo, now), false);

    // 25 hours ago: due for automatic daily sync
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
    assert.strictEqual(isSyncDue(twentyFiveHoursAgo, now), true);
  });

  it('clears last sync time on logout', () => {
    setLastAniListSyncTime(Date.now());
    assert.ok(getLastAniListSyncTime() !== null);

    clearAniListAuth();
    assert.strictEqual(getLastAniListSyncTime(), null);
    assert.strictEqual(localStorage.getItem(LAST_SYNC_STORAGE_KEY), null);
  });

  it('maps want-to-read to PLANNING and none to undefined for AniList status API', () => {
    assert.strictEqual(BOOK_STATUS_TO_ANILIST_STATUS['want-to-read'], 'PLANNING');
    assert.strictEqual(BOOK_STATUS_TO_ANILIST_STATUS.reading, 'CURRENT');
    assert.strictEqual(BOOK_STATUS_TO_ANILIST_STATUS.finished, 'COMPLETED');
    assert.strictEqual(BOOK_STATUS_TO_ANILIST_STATUS['on-hold'], 'PAUSED');
    assert.strictEqual(BOOK_STATUS_TO_ANILIST_STATUS.none, undefined);

    assert.strictEqual(ANILIST_STATUS_TO_BOOK_STATUS.PLANNING, 'want-to-read');
    assert.strictEqual(ANILIST_STATUS_TO_BOOK_STATUS.CURRENT, 'reading');
    assert.strictEqual(ANILIST_STATUS_TO_BOOK_STATUS.COMPLETED, 'finished');
  });

  it('broadcasts auth-cleared event with expiration reason when cleared', () => {
    let capturedDetail: { reason?: string } | undefined;
    const listener = (e: Event) => {
      capturedDetail = (e as CustomEvent<{ reason?: string }>).detail;
    };

    window.addEventListener(ANILIST_AUTH_CLEARED_EVENT, listener);
    clearAniListAuth('expired');
    window.removeEventListener(ANILIST_AUTH_CLEARED_EVENT, listener);

    assert.strictEqual(capturedDetail?.reason, 'expired');
  });
});
