import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | undefined;
}

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  // Reuse the same connection across Next.js hot-reloads in dev.
  if (!globalThis._redisClient) {
    globalThis._redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    globalThis._redisClient.on("error", (err: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[redis]", err.message);
      }
    });
  }
  redis = globalThis._redisClient;
}

// null when REDIS_URL is not set — all cache helpers gracefully no-op.
export default redis;
