import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});

const BATCH_SIZE = Number(process.env.PENDING_ORDERS_BATCH_SIZE || 50);
const MAX_DELAY_SECONDS = Number(process.env.PENDING_ORDERS_MAX_DELAY_SECONDS || 3600);

const nowIso = new Date().toISOString();
const { data: rows, error: listError } = await supabase
  .from("pending_orders")
  .select("id,source,customer_name,customer_phone,items,configuration,total_price,payload,attempts")
  .is("processed_at", null)
  .lte("next_retry_at", nowIso)
  .order("created_at", { ascending: true })
  .limit(BATCH_SIZE);

if (listError) {
  console.error("Failed to load pending_orders:", listError.message);
  process.exit(1);
}

if (!rows || rows.length === 0) {
  console.log("No pending orders ready for retry.");
  process.exit(0);
}

let processed = 0;
let failed = 0;

const scheduleNextRetry = async (row, errorMessage) => {
  const nextAttempts = Number(row.attempts || 0) + 1;
  const delaySeconds = Math.min(MAX_DELAY_SECONDS, Math.pow(2, nextAttempts) * 30);
  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  const { error } = await supabase
    .from("pending_orders")
    .update({
      attempts: nextAttempts,
      last_error: errorMessage,
      next_retry_at: nextRetryAt,
    })
    .eq("id", row.id);

  if (error) {
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

    const { error: insertError } = await supabase.from("orders").insert(orderData);
    if (insertError) {
      failed += 1;
      await scheduleNextRetry(row, insertError.message);
      continue;
    }

    const { error: doneError } = await supabase
      .from("pending_orders")
      .update({
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", row.id);

    if (doneError) {
      failed += 1;
      console.error(`Order inserted but failed to mark pending row ${row.id}: ${doneError.message}`);
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

if (failed > 0) {
  process.exit(1);
}
