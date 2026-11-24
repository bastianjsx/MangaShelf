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
} from '../services/anilistAuth.ts';
import type { Book } from '../types/book.ts';

export const AUTO_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day (24 hours)
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
            const isSyncDue = !lastSync || Date.now() - lastSync >= AUTO_SYNC_INTERVAL_MS;
            if (redirectToken || isSyncDue) {
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

  // Periodic check if browser tab remains open across days
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      const lastSync = getLastAniListSyncTime();
      const isDue = !lastSync || Date.now() - lastSync >= AUTO_SYNC_INTERVAL_MS;
      if (isDue && !isSyncing) {
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
    clearAniListAuth();
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
    handleLoginClick,
    handleLogout,
    handleDirectTokenSubmit,
    handleSyncManga,
  };
}
