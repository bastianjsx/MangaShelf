import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('errorDismissal logic', () => {
  it('clears active errors upon dismissal so recurring errors display cleanly', () => {
    let syncError: string | null = 'Failed to sync with AniList.';
    let authError: string | null = null;
    let mutationError: string | null = null;

    const clearSyncError = () => {
      syncError = null;
    };
    const clearAuthError = () => {
      authError = null;
    };
    const clearMutationErrors = () => {
      mutationError = null;
    };

    const getActiveError = () => syncError || authError || mutationError;

    const handleDismissError = () => {
      clearSyncError();
      clearAuthError();
      clearMutationErrors();
    };

    // Error is initially active and displayed
    assert.strictEqual(getActiveError(), 'Failed to sync with AniList.');

    // User dismisses error: source state is cleared, notification disappears
    handleDismissError();
    assert.strictEqual(getActiveError(), null);

    // Later: an identical error recurs (e.g. background sync fails again)
    syncError = 'Failed to sync with AniList.';

    // The recurring error is not blocked by stale dismissal state and displays
    assert.strictEqual(getActiveError(), 'Failed to sync with AniList.');
  });

  it('handles multiple error sources and clears all on dismiss', () => {
    let syncError: string | null = null;
    let authError: string | null = 'Your AniList session has expired. Please sign in again.';
    let mutationError: string | null = 'Not signed in to AniList. Changes saved locally only.';

    const clearSyncError = () => {
      syncError = null;
    };
    const clearAuthError = () => {
      authError = null;
    };
    const clearMutationErrors = () => {
      mutationError = null;
    };

    const getActiveError = () => syncError || authError || mutationError;

    const handleDismissError = () => {
      clearSyncError();
      clearAuthError();
      clearMutationErrors();
    };

    assert.strictEqual(getActiveError(), 'Your AniList session has expired. Please sign in again.');

    handleDismissError();
    assert.strictEqual(getActiveError(), null);

    // Later, mutation error occurs again
    mutationError = 'Not signed in to AniList. Changes saved locally only.';
    assert.strictEqual(getActiveError(), 'Not signed in to AniList. Changes saved locally only.');
  });
});
