import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLastAniListSyncTime,
  setLastAniListSyncTime,
  clearAniListAuth,
  LAST_SYNC_STORAGE_KEY,
} from './anilistAuth.ts';
import { AUTO_SYNC_INTERVAL_MS } from '../hooks/useAniListAuth.ts';

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

  it('determines whether 1 day has elapsed since last sync', () => {
    const now = Date.now();
    // 12 hours ago: not due
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
    setLastAniListSyncTime(twelveHoursAgo);
    assert.strictEqual(now - getLastAniListSyncTime()! >= AUTO_SYNC_INTERVAL_MS, false);

    // 25 hours ago: due for automatic daily sync
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
    setLastAniListSyncTime(twentyFiveHoursAgo);
    assert.strictEqual(now - getLastAniListSyncTime()! >= AUTO_SYNC_INTERVAL_MS, true);
  });

  it('clears last sync time on logout', () => {
    setLastAniListSyncTime(Date.now());
    assert.ok(getLastAniListSyncTime() !== null);

    clearAniListAuth();
    assert.strictEqual(getLastAniListSyncTime(), null);
    assert.strictEqual(localStorage.getItem(LAST_SYNC_STORAGE_KEY), null);
  });
});
