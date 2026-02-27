import type { Product } from "@/lib/products";

export interface ProductRow {
  id: number;
  name: string;
  price: string;
  segment: string | null;
  description: string | null;
  full_description: string | null;
  features: string[] | null;
  specs: { label: string; value: string }[] | null;
  colors: { name: string; hex: string; splitHex?: [string, string] }[] | null;
  color_gallery: unknown;
  badge: string | null;
  image: string | null;
  gallery: unknown;
  is_upgrade: boolean | null;
}

const mapPath = (value: string) => value;

const mapArray = (values: unknown) =>
  Array.isArray(values)
    ? values.map((item) => (typeof item === "string" ? mapPath(item) : item))
    : values;

const mapColorGallery = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;

  const result: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(value as Record<string, unknown>)) {
    result[key] = (Array.isArray(list) ? list : [])
      .filter((item) => typeof item === "string")
      .map((item) => mapPath(item));
  }
  return result;
};

export const mapProductRow = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  price: row.price,
  segment: row.segment ?? "standard",
  description: row.description ?? "",
  fullDescription: row.full_description ?? "",
  features: row.features ?? [],
  specs: row.specs ?? [],
  colors: row.colors ?? [],
  colorGallery: mapColorGallery(row.color_gallery),
  badge: row.badge ?? undefined,
  image: row.image ? mapPath(row.image) : undefined,
  gallery: (mapArray(row.gallery) as string[]) ?? [],
  isUpgrade: row.is_upgrade ?? false,
});

export const mapProductRows = (rows: ProductRow[] | null | undefined): Product[] =>
  (rows ?? []).map((row) => mapProductRow(row));
