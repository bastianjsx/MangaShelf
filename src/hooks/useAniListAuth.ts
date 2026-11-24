import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type AniListUser,
  getCachedAniListUser,
  getAniListClientId,
  getAniListToken,
  clearAniListAuth,
  handleOAuthRedirect,
  initiateAniListLogin,
  fetchCurrentAniListUser,
  fetchUserMangaCollection,
  getLastAniListSyncTime,
  setLastAniListSyncTime,
  ANILIST_AUTH_CLEARED_EVENT,
  isSyncDue,
} from '../services/anilistAuth.ts';
import type { Book } from '../types/book.ts';

const PERIODIC_CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check hourly if browser tab remains open

interface UseAniListAuthOptions {
  onSyncManga?: (remoteBooks: Book[]) => void;
}

export function useAniListAuth({ onSyncManga }: UseAniListAuthOptions = {}) {
  const [user, setUser] = useState<AniListUser | null>(getCachedAniListUser);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearSyncError = useCallback(() => setSyncError(null), []);
  const clearAuthError = useCallback(() => setAuthError(null), []);

  const handleSyncManga = useCallback(
    async (targetUserId?: number, targetToken?: string) => {
      const currentToken = targetToken || getAniListToken();
      const currentUserId = targetUserId || user?.id;
      if (!currentUserId) return;

      setIsSyncing(true);
      setSyncError(null);
      try {
        const remoteBooks = await fetchUserMangaCollection(
          currentUserId,
          currentToken || undefined
        );
        onSyncManga?.(remoteBooks);
        setLastAniListSyncTime();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sync with AniList.';
        console.error('Failed to sync collection from AniList:', err);
        setSyncError(message);
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, onSyncManga]
  );

  const syncMangaRef = useRef(handleSyncManga);
  useEffect(() => {
    syncMangaRef.current = handleSyncManga;
  }, [handleSyncManga]);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const redirectToken = handleOAuthRedirect();
      const token = redirectToken || getAniListToken();

      if (token) {
        try {
          const viewer = await fetchCurrentAniListUser(token);
          if (!cancelled) {
            setUser(viewer);
            const lastSync = getLastAniListSyncTime();
            if (redirectToken || isSyncDue(lastSync)) {
              await syncMangaRef.current(viewer.id, token);
            }
          }
        } catch (err) {
          if (!cancelled) {
            console.error('AniList auth initialization failed:', err);
            setUser(null);
            setAuthError(err instanceof Error ? err.message : 'AniList authentication failed');
          }
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for background session expirations (e.g. 401 during sync)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthCleared = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      setUser(null);
      if (customEvent.detail?.reason === 'expired') {
        setAuthError('Your AniList session has expired. Please sign in again.');
      } else {
        setAuthError(null);
      }
      setSyncError(null);
    };

    window.addEventListener(ANILIST_AUTH_CLEARED_EVENT, handleAuthCleared);
    return () => {
      window.removeEventListener(ANILIST_AUTH_CLEARED_EVENT, handleAuthCleared);
    };
  }, []);

  // Periodic check if browser tab remains open across days
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      const lastSync = getLastAniListSyncTime();
      if (isSyncDue(lastSync) && !isSyncing) {
        handleSyncManga(user.id);
      }
    }, PERIODIC_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user, isSyncing, handleSyncManga]);

  const handleLoginClick = useCallback(() => {
    const clientId = getAniListClientId();
    if (clientId) {
      initiateAniListLogin(clientId);
    } else {
      setIsLoginModalOpen(true);
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearAniListAuth('logout');
    setUser(null);
    setSyncError(null);
    setAuthError(null);
  }, []);

  const handleDirectTokenSubmit = useCallback(
    async (token: string) => {
      setAuthError(null);
      try {
        const viewer = await fetchCurrentAniListUser(token);
        setUser(viewer);
        await handleSyncManga(viewer.id, token);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid AniList token.';
        setAuthError(message);
      }
    },
    [handleSyncManga]
  );

  return {
    user,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isSyncing,
    syncError,
    authError,
    clearSyncError,
    clearAuthError,
    handleLoginClick,
    handleLogout,
    handleDirectTokenSubmit,
    handleSyncManga,
  };
}
