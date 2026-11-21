import type { Book, BookStatus } from '../types/book';
import { extractAniListAuthor } from './anilist';
import { requestAniListGraphQL } from './anilistClient';

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

export function getAniListClientId(): string {
  const envId = import.meta.env.VITE_ANILIST_CLIENT_ID as string | undefined;
  if (envId && envId.trim()) return envId.trim();
  return localStorage.getItem(CLIENT_ID_STORAGE_KEY)?.trim() || '';
}

export function setAniListClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
}

export function getAniListToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAniListToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
}

export function clearAniListAuth(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
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

  const match = hash.match(/access_token=([^&]+)/);
  if (match) {
    const token = decodeURIComponent(match[1]);
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
    const data = await requestAniListGraphQL<{ Viewer?: AniListUser }>(query, undefined, token);
    const viewer = data.Viewer;
    if (!viewer) {
      throw new Error('Failed to retrieve user profile from AniList.');
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(viewer));
    return viewer;
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      clearAniListAuth();
      throw new Error('AniList session has expired. Please log in again.');
    }
    throw err;
  }
}

interface AniListEntryMedia {
  id: number;
  title?: {
    english?: string;
    romaji?: string;
  };
  description?: string;
  coverImage?: {
    large?: string;
    medium?: string;
    color?: string;
  };
  staff?: {
    nodes?: { name?: { full?: string } }[];
  };
  volumes?: number;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  genres?: string[];
  siteUrl?: string;
  format?: string;
}

interface AniListListEntry {
  id: number;
  mediaId: number;
  status: string;
  progress?: number;
  progressVolumes?: number;
  media?: AniListEntryMedia;
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
    token
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

      const title =
        media.title?.english?.trim() ||
        media.title?.romaji?.trim() ||
        'Untitled';

      const author = extractAniListAuthor(media.staff);
      const coverUrl = media.coverImage?.large || media.coverImage?.medium || '';

      const genres = media.genres || [];
      const filteredGenres = genres.filter(
        (g) => Boolean(g) && g.toLowerCase() !== 'manga'
      );
      const categories = ['Manga', ...filteredGenres].slice(0, 3);
      const rawDescription = media.description || '';
      const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').trim();

      let status: BookStatus = 'none';
      if (entry.status === 'CURRENT') status = 'reading';
      else if (entry.status === 'COMPLETED') status = 'finished';
      else if (entry.status === 'PLANNING') status = 'want-to-read';
      else if (entry.status === 'PAUSED') status = 'on-hold';

      books.push({
        id: `anilist-${media.id}`,
        title,
        author,
        category: categories,
        coverUrl,
        spineColor: media.coverImage?.color || undefined,
        description: cleanDescription,
        status,
        volume: entry.progressVolumes || undefined,
        chapter: entry.progress || undefined,
        totalVolumes: media.volumes || undefined,
        createdAt: new Date().toISOString(),
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
    volumesOwned?: number;
    chapter?: number;
  }
): Promise<void> {
  let anilistStatus: string | undefined;
  if (updates.status === 'reading') anilistStatus = 'CURRENT';
  else if (updates.status === 'finished') anilistStatus = 'COMPLETED';
  else if (updates.status === 'want-to-read') anilistStatus = 'PLANNING';
  else if (updates.status === 'on-hold') anilistStatus = 'PAUSED';

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
    await requestAniListGraphQL(
      mutation,
      {
        mediaId,
        ...(anilistStatus && { status: anilistStatus }),
        ...(typeof updates.chapter === 'number' && { progress: updates.chapter }),
        ...(typeof updates.volume === 'number' && { progressVolumes: updates.volume }),
      },
      token
    );
  } catch (err) {
    console.warn('Network error while syncing changes to AniList:', err);
    throw err;
  }
}
