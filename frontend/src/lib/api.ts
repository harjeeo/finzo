const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const AUTH_STORAGE_KEY = "finzo.auth";
export const AUTH_CHANGED_EVENT = "finzo:auth-changed";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"];

function readStoredTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens: StoredTokens | null) {
  if (tokens) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: tokens }));
}

let refreshPromise: Promise<StoredTokens | null> | null = null;

/** Redeems the stored refresh token for a new token pair. De-duplicates concurrent callers. */
function refreshAccessToken(): Promise<StoredTokens | null> {
  const stored = readStoredTokens();
  if (!stored?.refreshToken) {
    return Promise.resolve(null);
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const tokens = (await res.json()) as StoredTokens;
        writeStoredTokens(tokens);
        return tokens;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function performRequest(
  path: string,
  method: string,
  body: unknown,
  token?: string | null,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  let { response, data } = await performRequest(path, method, body, token);

  if (response.status === 401 && token && !AUTH_ENDPOINTS.includes(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      ({ response, data } = await performRequest(
        path,
        method,
        body,
        refreshed.accessToken,
      ));
    } else {
      writeStoredTokens(null);
    }
  }

  if (!response.ok) {
    const message = data?.message ?? "Something went wrong";
    throw new ApiError(
      Array.isArray(message) ? message.join(", ") : message,
      response.status,
    );
  }

  return data as T;
}
