import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { getClientIp } from "@/lib/request-helpers";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
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

  try {
    const { rows } = await dbQuery(
      "select * from orders order by created_at desc"
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить заказы." }, { status: 500 });
  }
}
