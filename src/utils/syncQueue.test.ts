import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SyncQueue, type SyncPayload } from './syncQueue.ts';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('SyncQueue', () => {
  it('merges back-to-back mutations and dispatches combined payload', async () => {
    const calls: { mediaId: number; payload: SyncPayload }[] = [];
    const statuses: string[] = [];

    const queue = new SyncQueue({
      debounceMs: 50,
      onSync: async (mediaId, payload) => {
        calls.push({ mediaId, payload });
      },
      onStatusChange: (_bookId, status) => {
        statuses.push(status);
      },
    });

    // 1. Status change (e.g. want-to-read -> reading)
    queue.enqueue('anilist-101', 101, { status: 'reading' });
    // 2. Immediate progress update (e.g. volume 5)
    queue.enqueue('anilist-101', 101, { progressVolumes: 5, chapter: 20 });

    assert.strictEqual(calls.length, 0); // debounced
    await sleep(80);

    // Should have dispatched a single merged call
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].mediaId, 101);
    assert.deepStrictEqual(calls[0].payload, {
      status: 'reading',
      progressVolumes: 5,
      chapter: 20,
    });
    assert.ok(statuses.includes('synced'));
  });

  it('coalesces rapid button clicks or typing into the latest value', async () => {
    const calls: { mediaId: number; payload: SyncPayload }[] = [];

    const queue = new SyncQueue({
      debounceMs: 50,
      onSync: async (mediaId, payload) => {
        calls.push({ mediaId, payload });
      },
    });

    // Simulate 5 rapid clicks
    queue.enqueue('anilist-202', 202, { progressVolumes: 1 });
    await sleep(10);
    queue.enqueue('anilist-202', 202, { progressVolumes: 2 });
    await sleep(10);
    queue.enqueue('anilist-202', 202, { progressVolumes: 3 });
    await sleep(10);
    queue.enqueue('anilist-202', 202, { progressVolumes: 4 });
    await sleep(10);
    queue.enqueue('anilist-202', 202, { progressVolumes: 5 });

    await sleep(80);

    // Only 1 call dispatched with the latest volume progress
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].payload.progressVolumes, 5);
  });

  it('queues updates arriving while a request is in-flight and sends trailing payload', async () => {
    const calls: { mediaId: number; payload: SyncPayload }[] = [];

    const queue = new SyncQueue({
      debounceMs: 20,
      onSync: async (mediaId, payload) => {
        // Simulate network latency of 60ms
        await sleep(60);
        calls.push({ mediaId, payload });
      },
    });

    // Start first sync
    queue.enqueue('anilist-303', 303, { progressVolumes: 1 });
    await sleep(35); // timer fires, call 1 is now in-flight

    assert.strictEqual(queue.isInFlight('anilist-303'), true);

    // User makes second mutation while call 1 is in-flight
    queue.enqueue('anilist-303', 303, { progressVolumes: 2, chapter: 15 });

    // Wait for call 1 to finish (60ms latency + buffer)
    await sleep(80);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].payload.progressVolumes, 1);

    // Call 2 should now execute automatically
    await sleep(90);
    assert.strictEqual(calls.length, 2);
    assert.strictEqual(calls[1].payload.progressVolumes, 2);
    assert.strictEqual(calls[1].payload.chapter, 15);
    assert.strictEqual(queue.isInFlight('anilist-303'), false);
  });

  it('handles sync errors and notifies status callback', async () => {
    const errorStatuses: { status: string; error?: string }[] = [];

    const queue = new SyncQueue({
      debounceMs: 10,
      onSync: async () => {
        throw new Error('AniList API error 500');
      },
      onStatusChange: (_id, status, error) => {
        errorStatuses.push({ status, error });
      },
    });

    queue.enqueue('anilist-404', 404, { status: 'finished' });
    await sleep(40);

    const errorEvent = errorStatuses.find((e) => e.status === 'error');
    assert.ok(errorEvent);
    assert.strictEqual(errorEvent?.error, 'AniList API error 500');
    assert.strictEqual(queue.isInFlight('anilist-404'), false);
  });
});
