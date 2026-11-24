import type { Book, BookStatus } from '../types/book.ts';
import { transformAniListMediaToBook, type AniListMedia } from './anilist.ts';
import { requestAniListGraphQL, AniListAuthError } from './anilistClient.ts';

export interface AniListUser {
  id: number;
  name: string;
  avatar?: {
    medium?: string;
    large?: string;
  };
}

const TOKEN_STORAGE_KEY = 'anilist_oauth_token';
const USER_STORAGE_KEY = 'anilist_oauth_user';
const CLIENT_ID_STORAGE_KEY = 'anilist_client_id';
export const LAST_SYNC_STORAGE_KEY = 'anilist_last_full_sync_timestamp';

export function getLastAniListSyncTime(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
    if (!raw) return null;
    const time = parseInt(raw, 10);
    return isNaN(time) ? null : time;
  } catch {
    return null;
  }
}

export function setLastAniListSyncTime(timestamp: number = Date.now()): void {
  try {
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, String(timestamp));
  } catch {
    // ignore
  }
}

export const ANILIST_STATUS_TO_BOOK_STATUS: Record<string, BookStatus> = {
  CURRENT: 'reading',
  COMPLETED: 'finished',
  PLANNING: 'want-to-read',
  PAUSED: 'on-hold',
  DROPPED: 'on-hold',
  REPEATING: 'reading',
};

export const BOOK_STATUS_TO_ANILIST_STATUS: Record<BookStatus, string | undefined> = {
  reading: 'CURRENT',
  finished: 'COMPLETED',
  'want-to-read': 'PLANNING',
  'on-hold': 'PAUSED',
  none: undefined,
};

export function getAniListClientId(): string {
  const envId = import.meta.env.VITE_ANILIST_CLIENT_ID as string | undefined;
  if (envId && envId.trim()) return envId.trim();
  try {
    return localStorage.getItem(CLIENT_ID_STORAGE_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function setAniListClientId(clientId: string): void {
  try {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
  } catch {
    // ignore
  }
}

export function getAniListToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAniListToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  } catch {
    // ignore
  }
}

export function clearAniListAuth(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getCachedAniListUser(): AniListUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse cached AniList user:', err);
  }
  return null;
}

export function handleOAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const token = params.get('access_token');
  if (token) {
    setAniListToken(token);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return token;
  }
  return null;
}

export function initiateAniListLogin(clientId: string): void {
  const cleanId = clientId.trim();
  if (!cleanId) return;
  setAniListClientId(cleanId);
  const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(
    cleanId
  )}&response_type=token`;
  window.location.href = authUrl;
}

export async function fetchCurrentAniListUser(token: string): Promise<AniListUser> {
  const query = `
    query {
      Viewer {
        id
        name
        avatar {
          medium
          large
        }
      }
    }
  `;

  try {
    const data = await requestAniListGraphQL<{ Viewer?: AniListUser }>(query, undefined, { token });
    const viewer = data.Viewer;
    if (!viewer) {
      throw new Error('Failed to retrieve user profile from AniList.');
    }

    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(viewer));
    } catch {
      // ignore
    }
    return viewer;
  } catch (err) {
    if (err instanceof AniListAuthError) {
      clearAniListAuth();
      throw new Error('AniList session has expired. Please log in again.');
    }
    throw err;
  }
}

interface AniListListEntry {
  id: number;
  mediaId: number;
  status: string;
  progress?: number;
  progressVolumes?: number;
  media?: AniListMedia;
}

interface AniListMediaList {
  name: string;
  status?: string;
  entries?: AniListListEntry[];
}

export async function fetchUserMangaCollection(userId: number, token?: string): Promise<Book[]> {
  const query = `
    query ($userId: Int) {
      MediaListCollection(userId: $userId, type: MANGA) {
        lists {
          name
          status
          entries {
            id
            mediaId
            status
            progress
            progressVolumes
            media {
              id
              title {
                english
                romaji
              }
              description(asHtml: false)
              coverImage {
                large
                medium
                color
              }
              staff(sort: RELEVANCE, perPage: 1) {
                nodes {
                  name {
                    full
                  }
                }
              }
              volumes
              chapters
              genres
              siteUrl
              format
            }
          }
        }
      }
    }
  `;

  const data = await requestAniListGraphQL<{ MediaListCollection?: { lists?: AniListMediaList[] } }>(
    query,
    { userId },
    { token }
  );

  const lists: AniListMediaList[] = data.MediaListCollection?.lists || [];
  const books: Book[] = [];
  const seenMediaIds = new Set<number>();

  for (const list of lists) {
    const entries = list.entries || [];
    for (const entry of entries) {
      const media = entry.media;
      if (!media || seenMediaIds.has(media.id)) continue;
      if (media.format && media.format !== 'MANGA') continue;
      seenMediaIds.add(media.id);

      const baseBook = transformAniListMediaToBook(media);
      const status: BookStatus = ANILIST_STATUS_TO_BOOK_STATUS[entry.status] || 'none';
      const readVolumeCount = entry.progressVolumes || 0;
      const readVolumes =
        readVolumeCount > 0
          ? Array.from({ length: readVolumeCount }, (_, i) => i + 1)
          : [];

      books.push({
        ...baseBook,
        status,
        volume: readVolumeCount || undefined,
        readVolumes,
        chapter: entry.progress || undefined,
      });
    }
  }

  return books;
}

export async function syncEntryToAniList(
  token: string,
  mediaId: number,
  updates: {
    status?: BookStatus;
    volume?: number;
    progressVolumes?: number;
    volumesOwned?: number;
    chapter?: number;
  }
): Promise<void> {
  const anilistStatus = updates.status ? BOOK_STATUS_TO_ANILIST_STATUS[updates.status] : undefined;

  const mutation = `
    mutation (
      $mediaId: Int,
      $status: MediaListStatus,
      $progress: Int,
      $progressVolumes: Int
    ) {
      SaveMediaListEntry(
        mediaId: $mediaId,
        status: $status,
        progress: $progress,
        progressVolumes: $progressVolumes
      ) {
        id
        status
        progress
        progressVolumes
      }
    }
  `;

  try {
    const readVolumesToSend = typeof updates.progressVolumes === 'number'
      ? updates.progressVolumes
      : typeof updates.volume === 'number'
        ? updates.volume
        : undefined;

    await requestAniListGraphQL(
      mutation,
      {
        mediaId,
        ...(anilistStatus && { status: anilistStatus }),
        ...(typeof updates.chapter === 'number' && { progress: updates.chapter }),
        ...(typeof readVolumesToSend === 'number' && { progressVolumes: readVolumesToSend }),
      },
      { token }
    );
  } catch (err) {
    if (err instanceof AniListAuthError) {
      clearAniListAuth();
    }
    console.warn('Error while syncing changes to AniList:', err);
    throw err;
  }
}
