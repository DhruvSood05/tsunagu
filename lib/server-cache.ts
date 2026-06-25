import redis from "./redis";

// TTLs in seconds — tuned to balance freshness vs Google API call reduction.
export const TTL = {
  emails:    180,   // 3 min  — email list
  calEvents: 300,   // 5 min  — calendar events
  calList:   1800,  // 30 min — calendar list (rarely changes)
  drafts:    300,   // 5 min  — draft list
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Never let a cache write error break the response.
  }
}

// Cursor-based scan + delete — O(1) per iteration, never blocks Redis.
export async function cacheInvalidate(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== "0");
  } catch {
    // Invalidation failure is non-fatal — worst case: slightly stale data.
  }
}
