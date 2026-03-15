import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { enforceSameOrigin, getClientIp } from "@/lib/request-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { ProductPatchSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
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

  const patch = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  const push = (sql: string, value: unknown) => {
    values.push(value);
    fields.push(`${sql} = $${values.length}`);
  };
  const pushCast = (sql: string, value: unknown, cast: string) => {
    values.push(value);
    fields.push(`${sql} = $${values.length}::${cast}`);
  };

  if ("name" in patch) push("name", patch.name ?? null);
  if ("price" in patch) push("price", patch.price ?? null);
  if ("segment" in patch) push("segment", patch.segment ?? null);
  if ("description" in patch) push("description", patch.description ?? null);
  if ("full_description" in patch) push("full_description", patch.full_description ?? null);
  if ("features" in patch) pushCast("features", patch.features ?? [], "text[]");
  if ("specs" in patch) pushCast("specs", JSON.stringify(patch.specs ?? []), "jsonb");
  if ("colors" in patch) pushCast("colors", JSON.stringify(patch.colors ?? []), "jsonb");
  if ("color_gallery" in patch) {
    pushCast("color_gallery", JSON.stringify(patch.color_gallery ?? null), "jsonb");
  }
  if ("badge" in patch) push("badge", patch.badge ?? null);
  if ("image" in patch) push("image", patch.image ?? null);
  if ("gallery" in patch) pushCast("gallery", JSON.stringify(patch.gallery ?? []), "jsonb");
  if ("is_upgrade" in patch) push("is_upgrade", patch.is_upgrade ?? false);

  if (fields.length === 0) {
    return NextResponse.json({ ok: true });
  }

  values.push(id);
  try {
    await dbQuery(
      `update products
       set ${fields.join(", ")}
       where id = $${values.length}`,
      values
    );
  } catch {
    return NextResponse.json({ error: "Не удалось обновить товар." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
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

  try {
    await dbQuery("delete from products where id = $1", [id]);
  } catch {
    return NextResponse.json({ error: "Не удалось удалить товар." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
