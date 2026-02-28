import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import { getClientIp } from "@/lib/request-helpers";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const limiter = await rateLimit({
    key: `admin-orders-get:${await getClientIp(headers())}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Не удалось загрузить заказы." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
