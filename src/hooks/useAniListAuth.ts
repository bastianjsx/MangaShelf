import { useState, useEffect, useCallback } from 'react';
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

  const handleSyncManga = useCallback(
    async (targetUserId?: number, targetToken?: string) => {
      const currentToken = targetToken || getAniListToken();
      const currentUserId = targetUserId || user?.id;
      if (!currentUserId) return;

      setIsSyncing(true);
      try {
        const remoteBooks = await fetchUserMangaCollection(
          currentUserId,
          currentToken || undefined
        );
        onSyncManga?.(remoteBooks);
      } catch (err) {
        console.error('Failed to sync collection from AniList:', err);
        alert(err instanceof Error ? err.message : 'Failed to sync with AniList.');
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, onSyncManga]
  );

  useEffect(() => {
    const checkAuth = async () => {
      const redirectToken = handleOAuthRedirect();
      const token = redirectToken || getAniListToken();

      if (token) {
        try {
          const viewer = await fetchCurrentAniListUser(token);
          setUser(viewer);
          if (redirectToken) {
            await handleSyncManga(viewer.id, token);
          }
        } catch (err) {
          console.error('AniList auth initialization failed:', err);
          setUser(null);
        }
      }
    };

    checkAuth();
  }, [handleSyncManga]);

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
  }, []);

  const handleDirectTokenSubmit = useCallback(
    async (token: string) => {
      try {
        const viewer = await fetchCurrentAniListUser(token);
        setUser(viewer);
        await handleSyncManga(viewer.id, token);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Invalid AniList token.');
      }
    },
    [handleSyncManga]
  );

  return {
    user,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isSyncing,
    handleLoginClick,
    handleLogout,
    handleDirectTokenSubmit,
    handleSyncManga,
  };
}
