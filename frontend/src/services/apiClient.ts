export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

export const TOKEN_KEY = 'nexadash_token';

type ApiRequestOptions = RequestInit & {
  token?: string | null;
  errorMessage?: string;
  skipAuth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  {
    token,
    errorMessage = 'Erro ao comunicar com a API',
    skipAuth = false,
    headers,
    ...options
  }: ApiRequestOptions = {},
): Promise<T> {
  const storedToken = skipAuth ? null : token ?? localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function readErrorMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return '';
  }

  try {
    const parsed = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };

    if (parsed.message) {
      return parsed.message;
    }

    const firstError = Object.values(parsed.errors ?? {})[0]?.[0];
    return firstError ?? text;
  } catch {
    return text;
  }
}
