import "server-only";

import { dbQuery } from "@/lib/db";
import { mapProductRow, mapProductRows, type ProductRow } from "@/lib/product-row";

export async function getProductsFromDb() {
  const { rows } = await dbQuery<ProductRow>("select * from products order by id asc");
  return mapProductRows(rows);
}

export async function getProductIdsFromDb() {
  const { rows } = await dbQuery<{ id: number }>("select id from products order by id asc");
  return rows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id));
}

export async function getProductByIdFromDb(id: number) {
  const { rows } = await dbQuery<ProductRow>("select * from products where id = $1 limit 1", [id]);
  const data = rows[0];
  if (!data) {
    return null;
  }

  return mapProductRow(data);
}
