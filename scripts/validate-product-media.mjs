import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("products")
  .select("id,name,image,gallery,color_gallery")
  .order("id", { ascending: true });

if (error) {
  console.error("Failed to load products:", error.message);
  process.exit(1);
}

const missing = [];

const checkPath = (id, field, path) => {
  if (!path || typeof path !== "string") return;
  const decoded = decodeURIComponent(path);
  if (!decoded.startsWith("/")) {
    missing.push({ id, field, path, reason: "not-slash" });
    return;
  }
  if (!existsSync(`public${decoded}`)) {
    missing.push({ id, field, path, reason: "missing" });
  }
};

for (const row of data ?? []) {
  checkPath(row.id, "image", row.image);
  for (const item of row.gallery || []) {
    checkPath(row.id, "gallery", item);
  }
  for (const [key, list] of Object.entries(row.color_gallery || {})) {
    for (const item of Array.isArray(list) ? list : []) {
      checkPath(row.id, `color_gallery.${key}`, item);
    }
  }
}

if (missing.length > 0) {
  console.error(`Found ${missing.length} invalid media paths in products`);
  console.error(JSON.stringify(missing.slice(0, 50), null, 2));
  process.exit(1);
}

console.log(`Media validation passed: ${data?.length ?? 0} products, 0 broken paths.`);
