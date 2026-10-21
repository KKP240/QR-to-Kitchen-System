const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}