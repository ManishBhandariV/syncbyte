import { neon } from "@neondatabase/serverless";
import type { DbDriver, RunResult } from "./types";

type SqlClient = ReturnType<typeof neon>;

let sql: SqlClient | null = null;

function getSql(): SqlClient {
  if (sql) return sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for Postgres driver. Set it in your environment.",
    );
  }
  sql = neon(url);
  return sql;
}

async function pgQuery<T>(text: string, params: unknown[] = []): Promise<T[]> {
  // The `.query` method accepts a plain string and a params array.
  const client = getSql() as unknown as {
    query: (text: string, params?: unknown[]) => Promise<T[]>;
  };
  return client.query(text, params);
}

// Convert "?" placeholders to "$1, $2, ..." for Postgres.
function toPg(sqlStr: string): string {
  let i = 0;
  return sqlStr.replace(/\?/g, () => `$${++i}`);
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS product_specs (
    id            SERIAL PRIMARY KEY,
    product_id    TEXT NOT NULL,
    spec_key      TEXT NOT NULL,
    spec_value    TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON product_specs(product_id)`,
  `CREATE TABLE IF NOT EXISTS product_downloads (
    id            SERIAL PRIMARY KEY,
    product_id    TEXT NOT NULL,
    file_title    TEXT NOT NULL,
    file_url      TEXT NOT NULL,
    file_type     TEXT DEFAULT 'pdf',
    file_size     TEXT DEFAULT '',
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_product_downloads_product_id ON product_downloads(product_id)`,
  `CREATE TABLE IF NOT EXISTS admin_users (
    id            SERIAL PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    company     TEXT,
    designation TEXT,
    rating      INTEGER NOT NULL,
    review      TEXT NOT NULL,
    status      TEXT DEFAULT 'pending',
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS contact_enquiries (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    email       TEXT NOT NULL,
    product     TEXT,
    requirement TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,
];

// A statement that returns its inserted row. We rewrite trailing INSERTs to add RETURNING id.
function needsReturning(sql: string): boolean {
  return /^\s*insert\s+/i.test(sql) && !/returning/i.test(sql);
}

export const postgresDriver: DbDriver = {
  async all<T>(sqlStr: string, params: unknown[] = []) {
    return pgQuery<T>(toPg(sqlStr), params);
  },
  async get<T>(sqlStr: string, params: unknown[] = []) {
    const rows = await pgQuery<T>(toPg(sqlStr), params);
    return rows[0];
  },
  async run(sqlStr: string, params: unknown[] = []): Promise<RunResult> {
    const rewritten = needsReturning(sqlStr) ? `${sqlStr} RETURNING id` : sqlStr;
    const rows = await pgQuery<{ id?: number }>(toPg(rewritten), params);
    const first = rows[0];
    return {
      insertId: first && typeof first.id === "number" ? first.id : null,
      rowsAffected: rows.length,
    };
  },
  async init() {
    for (const stmt of SCHEMA_STATEMENTS) {
      await pgQuery(stmt);
    }
  },
};
