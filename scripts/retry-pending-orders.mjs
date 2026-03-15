import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

const BATCH_SIZE = Number(process.env.PENDING_ORDERS_BATCH_SIZE || 50);
const MAX_DELAY_SECONDS = Number(process.env.PENDING_ORDERS_MAX_DELAY_SECONDS || 3600);

const { rows } = await pool.query(
  `select id, source, customer_name, customer_phone, items, configuration, total_price, payload, attempts
   from pending_orders
   where processed_at is null and next_retry_at <= now()
   order by created_at asc
   limit $1`,
  [BATCH_SIZE]
);

if (!rows || rows.length === 0) {
  console.log("No pending orders ready for retry.");
  await pool.end();
  process.exit(0);
}

let processed = 0;
let failed = 0;

const scheduleNextRetry = async (row, errorMessage) => {
  const nextAttempts = Number(row.attempts || 0) + 1;
  const delaySeconds = Math.min(MAX_DELAY_SECONDS, Math.pow(2, nextAttempts) * 30);
  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  try {
    await pool.query(
      `update pending_orders
       set attempts = $1, last_error = $2, next_retry_at = $3
       where id = $4`,
      [nextAttempts, errorMessage, nextRetryAt, row.id]
    );
  } catch (error) {
    console.error(`Failed to update retry metadata for ${row.id}: ${error.message}`);
  }
};

for (const row of rows) {
  try {
    const orderData = {
      source: row.source,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      items: row.items ?? null,
      configuration: row.configuration ?? null,
      total_price: row.total_price ?? null,
      status: "new",
    };

    try {
      await pool.query(
        `insert into orders (
          source, customer_name, customer_phone, items, configuration, total_price, status
        ) values (
          $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7
        )`,
        [
          orderData.source,
          orderData.customer_name,
          orderData.customer_phone,
          JSON.stringify(orderData.items),
          JSON.stringify(orderData.configuration),
          orderData.total_price,
          orderData.status,
        ]
      );
    } catch (insertError) {
      failed += 1;
      await scheduleNextRetry(
        row,
        insertError instanceof Error ? insertError.message : String(insertError)
      );
      continue;
    }

    try {
      await pool.query(
        `update pending_orders
         set processed_at = now(), last_error = null
         where id = $1`,
        [row.id]
      );
    } catch (doneError) {
      failed += 1;
      console.error(
        `Order inserted but failed to mark pending row ${row.id}: ${doneError.message}`
      );
      continue;
    }

    processed += 1;
  } catch (error) {
    failed += 1;
    await scheduleNextRetry(
      row,
      error instanceof Error ? error.message : String(error)
    );
  }
}

console.log(
  `pending_orders retry finished. total=${rows.length}, processed=${processed}, failed=${failed}`
);
await pool.end();

if (failed > 0) {
  process.exit(1);
}
