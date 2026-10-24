const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "qrk_token";
const ORDER_TOKEN_PREFIX = "qrk_order_token:";

export function setOrderTrackingToken(orderId: string, token: string) {
  try {
    window.sessionStorage.setItem(`${ORDER_TOKEN_PREFIX}${orderId}`, token);
  } catch {
    // Tracking remains available until the current page is closed.
  }
}

function getOrderTrackingToken(path: string): string | null {
  if (typeof window === "undefined") return null;
  const match = /^\/orders\/([^/?#]+)$/.exec(path);
  if (!match) return null;
  try {
    return window.sessionStorage.getItem(`${ORDER_TOKEN_PREFIX}${decodeURIComponent(match[1])}`);
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const orderTrackingToken = getOrderTrackingToken(path);
  if (orderTrackingToken) headers.set("X-Order-Tracking-Token", orderTrackingToken);

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // Keep the HTTP status message for non-JSON responses.
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}