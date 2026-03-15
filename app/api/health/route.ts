import { stat } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

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

  if (!process.env.DATABASE_URL) {
    checks.env = { ok: false, details: "Missing DATABASE_URL" };
  }

  try {
    await dbQuery("select id from products limit 1");
  } catch (error) {
    checks.db = { ok: false, details: error instanceof Error ? error.message : "Unknown DB error" };
  }

  try {
    await stat(MODEL_PATH);
  } catch (error) {
    checks.media = {
      ok: true,
      details:
        error instanceof Error
          ? `Chair model unavailable, poster fallback active: ${error.message}`
          : "Chair model unavailable, poster fallback active",
    };
  }

  try {
    const { rows } = await dbQuery<{ count: string }>(
      "select count(*)::text as count from pending_orders where processed_at is null"
    );
    const count = Number(rows[0]?.count ?? "0");
    if (count > 100) {
      checks.queue = { ok: false, details: `Pending orders backlog is too high: ${count}` };
    } else {
      checks.queue = { ok: true, details: `Pending orders: ${count}` };
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
