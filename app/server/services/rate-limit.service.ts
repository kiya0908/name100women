import { RATE_LIMIT_PER_MINUTE } from "~/shared/constants";

export class RateLimitService {
  constructor(private readonly kv: KVNamespace) {}

  async allow(ipHash: string, sessionId: string): Promise<boolean> {
    const window = Math.floor(Date.now() / 60_000);
    const keys = [
      `rate:guess:${ipHash}:${window}`,
      `rate:session:${sessionId}:${window}`,
    ];

    try {
      const values = await Promise.all(keys.map((key) => this.kv.get(key)));
      const counts = values.map((value) => Number.parseInt(value ?? "0", 10));

      if (counts.some((count) => count >= RATE_LIMIT_PER_MINUTE)) {
        return false;
      }

      await Promise.all(
        keys.map((key, index) =>
          this.kv.put(key, String(counts[index] + 1), {
            expirationTtl: 120,
          }),
        ),
      );

      return true;
    } catch (error) {
      console.error("Rate limit cache failed open", error);
      return true;
    }
  }
}
