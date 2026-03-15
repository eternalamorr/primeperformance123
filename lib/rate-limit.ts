type RateLimitEntry = {
  count: number;
  resetAt: number;
};

import { dbQuery } from "@/lib/db";

const bucket = new Map<string, RateLimitEntry>();

const fallbackRateLimit = ({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) => {
  const now = Date.now();

  // Opportunistic cleanup to avoid unbounded in-memory growth on long-lived processes.
  for (const [bucketKey, entry] of bucket.entries()) {
    if (entry.resetAt <= now) {
      bucket.delete(bucketKey);
    }
  }

  const existing = bucket.get(key);

  if (!existing || existing.resetAt <= now) {
    const entry = { count: 1, resetAt: now + windowMs };
    bucket.set(key, entry);
    return { ok: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  bucket.set(key, existing);
  return { ok: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
};

export async function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  try {
    const result = await dbQuery<{ ok: boolean; remaining: number; reset_at: string }>(
      "select ok, remaining, reset_at from consume_rate_limit($1, $2, $3)",
      [key, limit, windowMs]
    );
    const row = result.rows[0];
    if (!row || typeof row.ok !== "boolean") {
      return fallbackRateLimit({ key, limit, windowMs });
    }

    return {
      ok: row.ok,
      remaining: Number(row.remaining ?? 0),
      resetAt: new Date(row.reset_at).getTime(),
    };
  } catch (error) {
    console.error(
      "Rate limit backend unavailable, using in-memory fallback:",
      error instanceof Error ? error.message : String(error)
    );
    return fallbackRateLimit({ key, limit, windowMs });
  }
}
