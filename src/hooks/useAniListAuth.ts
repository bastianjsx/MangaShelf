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
} from '../services/anilistAuth';
import type { Book } from '../types/book';

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
            if (redirectToken) {
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
