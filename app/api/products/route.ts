import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase-public";
import { mapProductRows, type ProductRow } from "@/lib/product-row";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Не удалось загрузить каталог." }, { status: 500 });
  }

  return NextResponse.json(mapProductRows(data as ProductRow[]));
}
