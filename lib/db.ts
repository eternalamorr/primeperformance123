import "server-only";

import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

function normalizeDatabaseUrl(rawValue: string) {
  let value = rawValue.trim();

  // Common copy-paste mistake from env files.
  value = value.replace(/^DATABASE_URL\s*=\s*/i, "").trim();

  // Some dashboards keep quotes from pasted values.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  // Remove accidental whitespace/newlines inserted while editing.
  value = value.replace(/\s+/g, "");

  // Common typo: host already contains port and an extra :PORT was added.
  value = value.replace(/:(\d+):(\d+)(?=\/|\?|$)/, ":$1");

  return value;
}

function getDatabaseUrl() {
  const rawValue = process.env.DATABASE_URL;
  if (!rawValue) {
    throw new Error("Missing DATABASE_URL");
  }

  const value = normalizeDatabaseUrl(rawValue);
  if (!value) {
    throw new Error("Missing DATABASE_URL");
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
      throw new Error("Invalid DATABASE_URL protocol");
    }
  } catch {
    throw new Error(
      "Invalid DATABASE_URL format. Expected postgresql://user:password@host:5432/db?sslmode=require"
    );
  }

  return value;
}

function getSslConfig() {
  if (process.env.DATABASE_SSL === "0") return false;
  if (process.env.NODE_ENV !== "production") return false;
  return {
    rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== "0",
  };
}

export function getDbPool() {
  if (!pool) {
    const connectTimeoutMs = Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 5000);
    const queryTimeoutMs = Number(process.env.DATABASE_QUERY_TIMEOUT_MS || 8000);

    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: getSslConfig(),
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      connectionTimeoutMillis: Number.isFinite(connectTimeoutMs) ? connectTimeoutMs : 5000,
      query_timeout: Number.isFinite(queryTimeoutMs) ? queryTimeoutMs : 8000,
    });
  }
  return pool;
}

export async function dbQuery<T extends QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> {
  return getDbPool().query<T>(text, values);
}
