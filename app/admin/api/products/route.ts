import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { enforceSameOrigin, getClientIp } from "@/lib/request-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { ProductSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { rows } = await dbQuery("select * from products order by id asc");
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить товары." }, { status: 500 });
  }
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

  const product = parsed.data;
  try {
    await dbQuery(
      `insert into products (
        id, name, price, segment, description, full_description, features, specs, colors,
        color_gallery, badge, image, gallery, is_upgrade
      ) values (
        $1, $2, $3, $4, $5, $6, $7::text[], $8::jsonb, $9::jsonb,
        $10::jsonb, $11, $12, $13::jsonb, $14
      )`,
      [
        product.id,
        product.name,
        product.price,
        product.segment,
        product.description ?? null,
        product.full_description ?? null,
        product.features ?? [],
        JSON.stringify(product.specs ?? []),
        JSON.stringify(product.colors ?? []),
        JSON.stringify(product.color_gallery ?? null),
        product.badge ?? null,
        product.image ?? null,
        JSON.stringify(product.gallery ?? []),
        product.is_upgrade ?? false,
      ]
    );
  } catch {
    return NextResponse.json({ error: "Не удалось создать товар." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
