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

export interface AniListMedia {
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

export function extractAniListAuthor(staff?: { nodes?: { name?: { full?: string } }[] }): string {
  if (staff?.nodes && staff.nodes.length > 0 && staff.nodes[0]?.name?.full) {
    return staff.nodes[0].name.full;
  }
  return 'Unknown Author';
}

export function transformAniListMediaToBook(media: AniListMedia): Book {
  const title = media.title.english || media.title.romaji || 'Untitled';
  const author = extractAniListAuthor(media.staff);
  const coverUrl = media.coverImage?.large || media.coverImage?.medium || '';
  const spineColor = media.coverImage?.color || undefined;
  const releaseDate = formatAniListDate(media.startDate);

  const genres = media.genres || [];
  const filteredGenres = genres.filter((g) => Boolean(g) && g.toLowerCase() !== 'manga');
  const category = ['Manga', ...filteredGenres].slice(0, 3);

  const rawDescription = media.description || '';
  const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').trim();

  return {
    id: `anilist-${media.id}`,
    title,
    author,
    category,
    coverUrl,
    spineColor,
    releaseDate,
    description: cleanDescription,
    totalVolumes: media.volumes || undefined,
    status: 'none',
    createdAt: new Date().toISOString(),
  };
}

export async function searchAniList(
  search: string,
  perPage = 10,
  signal?: AbortSignal
): Promise<Book[]> {
  const data = await requestAniListGraphQL<{ Page?: { media?: AniListMedia[] } }>(
    SEARCH_MANGA_QUERY,
    { search, perPage },
    { signal }
  );

  const mediaList = data.Page?.media || [];
  return mediaList.map(transformAniListMediaToBook);
}
