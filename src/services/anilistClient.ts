export const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

export interface GraphQLErrorDetail {
  message: string;
  status?: number;
  locations?: { line: number; column: number }[];
  fields?: string[];
  [key: string]: unknown;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorDetail[];
}

export class AniListError extends Error {
  status?: number;
  graphQLErrors?: GraphQLErrorDetail[];
  responseBody?: unknown;

  constructor(
    message: string,
    status?: number,
    graphQLErrors?: GraphQLErrorDetail[],
    responseBody?: unknown
  ) {
    super(message);
    this.name = 'AniListError';
    this.status = status;
    this.graphQLErrors = graphQLErrors;
    this.responseBody = responseBody;
  }
}

export class AniListAuthError extends AniListError {
  constructor() {
    super('UNAUTHORIZED', 401);
    this.name = 'AniListAuthError';
  }
}

export class AniListRateLimitError extends AniListError {
  retryAfterSeconds?: number;

  constructor(retryAfterSeconds?: number) {
    super(
      retryAfterSeconds
        ? `AniList rate limit exceeded. Please wait ${retryAfterSeconds} seconds.`
        : 'AniList rate limit exceeded. Please wait a moment.',
      429
    );
    this.name = 'AniListRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface RequestOptions {
  token?: string | null;
  signal?: AbortSignal;
}

export async function requestAniListGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let res: Response;
  try {
    res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: options.signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new AniListError(
      err instanceof Error ? err.message : 'Network error communicating with AniList'
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new AniListAuthError();
    }
    if (res.status === 429) {
      const retryHeader = res.headers.get('Retry-After');
      let retryAfter: number | undefined;
      if (retryHeader) {
        const parsed = parseInt(retryHeader, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          retryAfter = parsed;
        }
      }
      throw new AniListRateLimitError(retryAfter);
    }
    throw new AniListError(`AniList error: ${res.status} ${res.statusText}`, res.status);
  }

  let json: GraphQLResponse<T>;
  try {
    json = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new AniListError(`Failed to parse AniList response as JSON: ${res.statusText}`, res.status);
  }

  if (json.errors && json.errors.length > 0) {
    const primaryMessage = json.errors.map((e) => e.message).join('; ') || 'GraphQL error occurred.';
    const primaryStatus = json.errors[0]?.status || res.status;
    const isAuthError =
      primaryStatus === 401 ||
      json.errors.some(
        (e) =>
          e.status === 401 ||
          e.message?.toLowerCase().includes('unauthorized') ||
          e.message?.toLowerCase().includes('invalid token')
      );
    if (isAuthError) {
      throw new AniListAuthError();
    }
    throw new AniListError(primaryMessage, primaryStatus, json.errors, json);
  }

  if (!json.data) {
    throw new AniListError('No data received from AniList GraphQL.', res.status, undefined, json);
  }

  return json.data;
}
