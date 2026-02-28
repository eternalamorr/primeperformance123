import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase-public";

export const runtime = "nodejs";

export async function GET() {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from("product_extras")
    .select("id,label,price")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: "Не удалось загрузить доп. функции." }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    price: item.price,
  })));
}
