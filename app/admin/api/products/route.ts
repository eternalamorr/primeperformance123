import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import { enforceSameOrigin, getClientIp } from "@/lib/request-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { ProductSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Не удалось загрузить товары." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const originCheck = enforceSameOrigin(request);
  if (originCheck) return originCheck;

  const limiter = await rateLimit({
    key: `admin-products-post:${await getClientIp(headers())}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные товара.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("products").insert(parsed.data);
  if (error) {
    return NextResponse.json({ error: "Не удалось создать товар." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
