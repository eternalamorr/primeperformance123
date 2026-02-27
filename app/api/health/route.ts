import { stat } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublic } from "@/lib/supabase-public";

export const runtime = "nodejs";

const MODEL_PATH = join(process.cwd(), "models", "766e7299c962b7daa4070f9bfa59fbfc.glb");

export async function GET() {
  const startedAt = Date.now();

  const checks: Record<string, { ok: boolean; details?: string }> = {
    api: { ok: true },
    env: { ok: true },
    db: { ok: true },
    media: { ok: true },
    queue: { ok: true },
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    checks.env = { ok: false, details: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" };
  }

  try {
    const { error } = await supabasePublic.from("products").select("id", { count: "exact", head: true });
    if (error) {
      checks.db = { ok: false, details: error.message };
    }
  } catch (error) {
    checks.db = { ok: false, details: error instanceof Error ? error.message : "Unknown DB error" };
  }

  try {
    await stat(MODEL_PATH);
  } catch (error) {
    checks.media = {
      ok: false,
      details: error instanceof Error ? error.message : "Chair model not found",
    };
  }

  try {
    const { count, error } = await supabaseAdmin
      .from("pending_orders")
      .select("id", { count: "exact", head: true })
      .is("processed_at", null);

    if (error) {
      checks.queue = { ok: false, details: error.message };
    } else if ((count ?? 0) > 100) {
      checks.queue = { ok: false, details: `Pending orders backlog is too high: ${count}` };
    } else {
      checks.queue = { ok: true, details: `Pending orders: ${count ?? 0}` };
    }
  } catch (error) {
    checks.queue = {
      ok: false,
      details: error instanceof Error ? error.message : "Unknown queue error",
    };
  }

  const ok = Object.values(checks).every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      responseMs: Date.now() - startedAt,
      checks,
    },
    { status: ok ? 200 : 503 }
  );
}
