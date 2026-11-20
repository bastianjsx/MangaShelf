import type { Book } from '../types/book';
import { requestAniListGraphQL } from './anilistClient';

const SEARCH_MANGA_QUERY = `
query ($search: String, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: MANGA, format: MANGA, sort: SEARCH_MATCH) {
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
      startDate {
        year
        month
        day
      }
      genres
      siteUrl
    }
  }
}
`;

export function formatAniListDate(date?: { year?: number; month?: number; day?: number }): string | undefined {
  if (!date || !date.year) return undefined;
  if (date.month && date.day) {
    const d = new Date(date.year, date.month - 1, date.day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (date.month) {
    const d = new Date(date.year, date.month - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return String(date.year);
}

interface AniListMedia {
  id: number;
  title: {
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
}

export function extractAniListAuthor(staff?: {
  nodes?: { name?: { full?: string } }[];
}): string {
  return staff?.nodes?.[0]?.name?.full || 'Unknown Creator';
}

export async function searchAniList(query: string, perPage = 8): Promise<Book[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await requestAniListGraphQL<{ Page?: { media?: AniListMedia[] } }>(
    SEARCH_MANGA_QUERY,
    {
      search: trimmed,
      perPage,
    }
  );

  const mediaList: AniListMedia[] = data.Page?.media || [];

  return mediaList.map((media): Book => {
    const title = media.title.english?.trim() || media.title.romaji?.trim() || 'Untitled';
    const author = extractAniListAuthor(media.staff);
    const coverUrl = media.coverImage?.large || media.coverImage?.medium || '';
    const filteredGenres = (media.genres || []).filter(
      (g) => Boolean(g) && g.toLowerCase() !== 'manga'
    );
    const categories = ['Manga', ...filteredGenres].slice(0, 3);
    const rawDescription = media.description || '';
    const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').trim();

    return {
      id: `anilist-${media.id}`,
      title,
      author,
      category: categories,
      coverUrl,
      spineColor: media.coverImage?.color || undefined,
      description: cleanDescription,
      status: 'want-to-read',
      createdAt: new Date().toISOString(),
      releaseDate: formatAniListDate(media.startDate),
      totalVolumes: media.volumes || undefined,
    };
  });
}
