import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import { enforceSameOrigin, getClientIp } from "@/lib/request-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { ProductPatchSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const supabaseAdmin = getSupabaseAdmin();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const originCheck = enforceSameOrigin(request);
  if (originCheck) return originCheck;

  const limiter = await rateLimit({
    key: `admin-products-put:${await getClientIp(headers())}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Некорректный id." }, { status: 400 });
  }

  const parsed = ProductPatchSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные товара.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("products")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Не удалось обновить товар." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const supabaseAdmin = getSupabaseAdmin();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const originCheck = enforceSameOrigin(request);
  if (originCheck) return originCheck;

  const limiter = await rateLimit({
    key: `admin-products-delete:${await getClientIp(headers())}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Некорректный id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Не удалось удалить товар." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
