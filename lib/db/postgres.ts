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
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    email_sent  INTEGER DEFAULT 0,
    email_error TEXT
  )`,
  `ALTER TABLE contact_enquiries ADD COLUMN IF NOT EXISTS email_sent INTEGER DEFAULT 0`,
  `ALTER TABLE contact_enquiries ADD COLUMN IF NOT EXISTS email_error TEXT`,
  `CREATE TABLE IF NOT EXISTS product_meta (
    id            SERIAL PRIMARY KEY,
    product_id    TEXT UNIQUE NOT NULL,
    brand         TEXT,
    display_order INTEGER DEFAULT 0,
    image_url     TEXT,
    name_override TEXT,
    is_hidden     INTEGER DEFAULT 0,
    category_override TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_product_meta_brand ON product_meta(brand)`,
  `CREATE INDEX IF NOT EXISTS idx_product_meta_order ON product_meta(display_order)`,
  // Idempotent migrations for existing schemas.
  `ALTER TABLE product_meta ADD COLUMN IF NOT EXISTS image_url TEXT`,
  `ALTER TABLE product_meta ADD COLUMN IF NOT EXISTS name_override TEXT`,
  `ALTER TABLE product_meta ADD COLUMN IF NOT EXISTS is_hidden INTEGER DEFAULT 0`,
  `ALTER TABLE product_meta ADD COLUMN IF NOT EXISTS category_override TEXT`,

  `CREATE TABLE IF NOT EXISTS gallery_images (
    id            SERIAL PRIMARY KEY,
    image_url     TEXT NOT NULL,
    title         TEXT NOT NULL,
    location      TEXT,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS gallery_videos (
    id            SERIAL PRIMARY KEY,
    youtube_id    TEXT NOT NULL,
    title         TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS brand_logos (
    brand_slug TEXT PRIMARY KEY,
    logo_url   TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS product_features (
    id            SERIAL PRIMARY KEY,
    product_id    TEXT NOT NULL,
    feature       TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_product_features_product_id ON product_features(product_id)`,
  `CREATE TABLE IF NOT EXISTS custom_products (
    id            SERIAL PRIMARY KEY,
    product_id    TEXT UNIQUE NOT NULL,
    category_slug TEXT NOT NULL,
    name          TEXT NOT NULL,
    short_desc    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_custom_products_category ON custom_products(category_slug)`,
  `CREATE TABLE IF NOT EXISTS custom_brands (
    id         SERIAL PRIMARY KEY,
    slug       TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS featured_products (
    id            SERIAL PRIMARY KEY,
    product_id    TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS carousel_slides (
    id            SERIAL PRIMARY KEY,
    image_url     TEXT NOT NULL,
    button_label  TEXT NOT NULL DEFAULT 'Explore',
    category_slug TEXT NOT NULL DEFAULT '',
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS site_downloads (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT,
    file_url      TEXT NOT NULL,
    file_type     TEXT DEFAULT 'pdf',
    file_size     TEXT DEFAULT '',
    category      TEXT DEFAULT 'Other',
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS product_images (
    id            SERIAL PRIMARY KEY,
    product_id    TEXT NOT NULL,
    image_url     TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)`,
  `CREATE TABLE IF NOT EXISTS custom_categories (
    id            SERIAL PRIMARY KEY,
    slug          TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    icon          TEXT NOT NULL DEFAULT 'fa-folder',
    description   TEXT NOT NULL DEFAULT '',
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
];

// Tables without an `id` column — skip the auto-appended RETURNING id.
const NO_ID_TABLES = ["brand_logos"];

// A statement that returns its inserted row. We rewrite trailing INSERTs to add RETURNING id,
// except for tables we know don't have an `id` column.
function needsReturning(sql: string): boolean {
  if (!/^\s*insert\s+/i.test(sql)) return false;
  if (/returning/i.test(sql)) return false;
  for (const t of NO_ID_TABLES) {
    if (new RegExp(`insert\\s+into\\s+${t}\\b`, "i").test(sql)) return false;
  }
  return true;
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
