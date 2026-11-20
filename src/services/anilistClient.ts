export const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export async function requestAniListGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(`AniList error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0]?.message || 'GraphQL error occurred.');
  }

  if (!json.data) {
    throw new Error('No data received from AniList GraphQL.');
  }

  return json.data;
}
