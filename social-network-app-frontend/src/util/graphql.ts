import type { GraphqlResponse } from '../types/graphql';

/** Backend origin (no trailing slash). Override with `VITE_API_URL`. */
export const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

export async function graphqlFetch<TData = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string | null
): Promise<GraphqlResponse<TData>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });

  return response.json() as Promise<GraphqlResponse<TData>>;
}
