import LRUCache from "lru-cache";

export function rateLimit({
  interval = 60 * 1000, // 1 minutt
  uniqueTokenPerInterval = 500,
}: {
  interval?: number;
  uniqueTokenPerInterval?: number;
}) {
  const tokenCache = new LRUCache({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        const now = Date.now();
        const windowStart = now - interval;

        // Fjern gamle tokens
        while (tokenCount.length && tokenCount[0] < windowStart) {
          tokenCount.shift();
        }

        // Sjekk om vi har nådd grensen
        if (tokenCount.length >= limit) {
          reject(new Error("rate limit exceeded"));
          return;
        }

        // Legg til ny token
        tokenCount.push(now);
        tokenCache.set(token, tokenCount);
        resolve();
      }),
  };
} 