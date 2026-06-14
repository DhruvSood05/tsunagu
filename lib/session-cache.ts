import { auth } from "@/lib/auth";

type Entry = { value: Awaited<ReturnType<typeof auth.api.getSession>>; expiresAt: number };

const cache = new Map<string, Entry>();
const TTL_MS = 60_000; // 1 minute — safe, sessions last much longer

// Periodically evict expired entries so the Map doesn't grow unbounded
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt < now) cache.delete(key);
    }
  }, 5 * 60_000).unref?.();
}

export async function getSessionCached(
  headersInput: Headers,
): Promise<Awaited<ReturnType<typeof auth.api.getSession>>> {
  // Extract the session token from the Cookie header to use as cache key
  const cookie = headersInput.get("cookie") ?? "";
  const match = cookie.match(/better-auth\.session_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  if (token) {
    const hit = cache.get(token);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
  }

  const session = await auth.api.getSession({ headers: headersInput });

  if (token) {
    cache.set(token, { value: session, expiresAt: Date.now() + TTL_MS });
  }

  return session;
}

/** Call on sign-out so the cached entry is invalidated immediately. */
export function invalidateSession(token: string) {
  cache.delete(token);
}
