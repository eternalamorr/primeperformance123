import { existsSync } from "node:fs";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const { rows: data } = await pool.query(
  "select id, name, image, gallery, color_gallery from products order by id asc"
);

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
  await pool.end();
  process.exit(1);
}

console.log(`Media validation passed: ${data?.length ?? 0} products, 0 broken paths.`);
await pool.end();
