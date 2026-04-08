import type { ApiEnvelope } from "@vouch/types";

type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthStorage = {
  getAccessToken: () => string;
  getRefreshToken: () => string;
  setTokens: (tokens: TokenPair) => void;
  clearTokens: () => void;
};

export function createBrowserAuthStorage(prefix = "vouch") : AuthStorage {
  const accessKey = `${prefix}_access_token`;
  const refreshKey = `${prefix}_refresh_token`;

  return {
    getAccessToken: () => (typeof window === "undefined" ? "" : localStorage.getItem(accessKey) || ""),
    getRefreshToken: () => (typeof window === "undefined" ? "" : localStorage.getItem(refreshKey) || ""),
    setTokens: ({ accessToken, refreshToken }) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(accessKey, accessToken);
      localStorage.setItem(refreshKey, refreshToken);
    },
    clearTokens: () => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(accessKey);
      localStorage.removeItem(refreshKey);
    },
  };
}

export function createApiClient(baseUrl: string, authStorage: AuthStorage) {
  async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const token = options.token || authStorage.getAccessToken();
    let response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401 && path !== "/auth/refresh") {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          const refreshPayload = (await refreshResponse.json()) as ApiEnvelope<TokenPair>;
          if (refreshPayload.status === "success") {
            authStorage.setTokens(refreshPayload.data);
            response = await fetch(`${baseUrl}${path}`, {
              method: options.method ?? "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshPayload.data.accessToken}`,
              },
              body: options.body ? JSON.stringify(options.body) : undefined,
            });
          }
        }
      }
    }

    const payload = await response.json();
    const envelope = payload as ApiEnvelope<T>;
    if (!response.ok) {
      if (envelope.status === "error") {
        throw new Error(envelope.message || "Request failed");
      }
      throw new Error("Request failed");
    }
    if (envelope.status === "success") {
      return envelope.data;
    }
    throw new Error(envelope.message || "Request failed");
  }

  return { apiFetch };
}