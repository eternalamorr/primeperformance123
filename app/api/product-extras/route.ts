import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { rows } = await dbQuery<{ id: string; label: string; price: number }>(
      `select id, label, price
       from product_extras
       where is_active = true
       order by sort_order asc, id asc`
    );
    return NextResponse.json(
      rows.map((item) => ({
        id: item.id,
        label: item.label,
        price: item.price,
      }))
    );
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";
    if (code === "42P01") {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: "Не удалось загрузить доп. функции." }, { status: 500 });
  }
}
