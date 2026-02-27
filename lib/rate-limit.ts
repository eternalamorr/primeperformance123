type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const bucket = new Map<string, RateLimitEntry>();
let supabaseClientPromise: Promise<
  import("@supabase/supabase-js").SupabaseClient | null
> | null = null;

const getSupabaseForRateLimit = async () => {
  if (!supabaseClientPromise) {
    supabaseClientPromise = (async () => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceRoleKey) return null;
      const { createClient } = await import("@supabase/supabase-js");
      return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
    })();
  }
  return supabaseClientPromise;
};

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
    const supabase = await getSupabaseForRateLimit();
    if (!supabase) {
      return fallbackRateLimit({ key, limit, windowMs });
    }

    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });

    if (error) {
      console.error("Supabase rate limit RPC failed, using in-memory fallback:", error.message);
      return fallbackRateLimit({ key, limit, windowMs });
    }

    const row = Array.isArray(data) ? data[0] : data;
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
