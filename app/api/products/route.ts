import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { mapProductRows, type ProductRow } from "@/lib/product-row";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { rows } = await dbQuery<ProductRow>("select * from products order by id asc");
    return NextResponse.json(mapProductRows(rows));
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить каталог." }, { status: 500 });
  }
}
