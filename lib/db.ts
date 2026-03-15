import "server-only";

import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("Missing DATABASE_URL");
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
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: getSslConfig(),
      max: Number(process.env.DATABASE_POOL_MAX || 10),
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

