export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Sliding-window rate limiter store for server mutations.
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 }) {
    this.config = config;
  }

  public check(key: string, nowMs: number = Date.now()): RateLimitResult {
    const windowStart = nowMs - this.config.windowMs;
    const existing = this.hits.get(key) ?? [];
    const active = existing.filter((timestamp) => timestamp > windowStart);

    if (active.length >= this.config.maxRequests) {
      const oldest = active[0] ?? nowMs;
      const retryAfterMs = Math.max(0, oldest + this.config.windowMs - nowMs);
      this.hits.set(key, active);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      };
    }

    active.push(nowMs);
    this.hits.set(key, active);

    return {
      allowed: true,
      remaining: Math.max(0, this.config.maxRequests - active.length),
      retryAfterMs: 0,
    };
  }

  public reset(): void {
    this.hits.clear();
  }
}

export const orderSubmissionRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

/**
 * Anti-spam honeypot check: invisible field must remain empty.
 */
export function isSpamHoneypotTripped(value?: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
