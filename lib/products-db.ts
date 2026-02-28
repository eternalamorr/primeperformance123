import "server-only";

import { getSupabasePublic } from "@/lib/supabase-public";
import { mapProductRow, mapProductRows, type ProductRow } from "@/lib/product-row";

export async function getProductsFromDb() {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load products");
  }

  return mapProductRows(data as ProductRow[]);
}

export async function getProductIdsFromDb() {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from("products")
    .select("id")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load product ids");
  }

  return (data ?? []).map((row) => Number(row.id)).filter((id) => Number.isFinite(id));
}

export async function getProductByIdFromDb(id: number) {
  const supabasePublic = getSupabasePublic();
  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load product");
  }

  if (!data) {
    return null;
  }

  return mapProductRow(data as ProductRow);
}
