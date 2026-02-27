const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
const maxResponseMs = Number(process.env.MONITOR_MAX_RESPONSE_MS || 2500);

const checks = [
  { path: "/api/health", name: "health", validateJsonOk: true },
  { path: "/api/products", name: "products" },
  { path: "/api/chair-model?v=20260213", name: "chair-model", method: "HEAD" },
];

const failures = [];
const timeoutMs = Number(process.env.MONITOR_TIMEOUT_MS || 10000);

for (const check of checks) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}${check.path}`, {
      method: check.method || "GET",
      signal: controller.signal,
    });
    const duration = Date.now() - started;
    if (!res.ok) {
      failures.push(`${check.name}: HTTP ${res.status} (${duration}ms)`);
      continue;
    }
    if (duration > maxResponseMs) {
      failures.push(
        `${check.name}: too slow (${duration}ms > ${maxResponseMs}ms threshold)`
      );
    }
    if (check.validateJsonOk) {
      const body = await res.json().catch(() => null);
      if (!body || body.ok !== true) {
        failures.push(`${check.name}: payload.ok is not true`);
      }
    }
  } catch (error) {
    failures.push(
      `${check.name}: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

if (failures.length === 0) {
  console.log(`Monitor check passed for ${baseUrl}`);
  process.exit(0);
}

console.error("Monitor check failed:");
for (const item of failures) {
  console.error(`- ${item}`);
}

if (telegramToken && telegramChatId) {
  const text = [
    "ALERT: Prime Performance site check failed",
    `Time: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    ...failures.map((f) => `- ${f}`),
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: telegramChatId, text }),
    });
  } catch (error) {
    console.error("Failed to send Telegram alert:", error instanceof Error ? error.message : String(error));
  }
} else {
  console.error("Telegram alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.");
}

process.exit(1);
