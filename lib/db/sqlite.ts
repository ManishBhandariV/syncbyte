import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import type { DbDriver, RunResult } from "./types";

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = process.env.SQLITE_PATH ?? path.join(dataDir, "syncbyte.db");
  dbInstance = new Database(dbPath);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");
  return dbInstance;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS product_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  spec_key TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON product_specs(product_id);

CREATE TABLE IF NOT EXISTS product_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  file_title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  file_size TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_downloads_product_id ON product_downloads(product_id);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  designation TEXT,
  rating INTEGER NOT NULL,
  review TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  product TEXT,
  requirement TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT UNIQUE NOT NULL,
  brand TEXT,
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_meta_brand ON product_meta(brand);
CREATE INDEX IF NOT EXISTS idx_product_meta_order ON product_meta(display_order);
`;

// Best-effort migrations for already-existing schemas (e.g. local dev DB).
// SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we try/catch.
const MIGRATIONS = [
  "ALTER TABLE product_meta ADD COLUMN image_url TEXT",
];

export const sqliteDriver: DbDriver = {
  async all<T>(sql: string, params: unknown[] = []) {
    return getDb().prepare(sql).all(...(params as never[])) as T[];
  },
  async get<T>(sql: string, params: unknown[] = []) {
    return getDb().prepare(sql).get(...(params as never[])) as T | undefined;
  },
  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const info = getDb().prepare(sql).run(...(params as never[]));
    return {
      insertId: Number(info.lastInsertRowid ?? 0) || null,
      rowsAffected: info.changes,
    };
  },
  async init() {
    const db = getDb();
    for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
      db.exec(stmt);
    }
    for (const m of MIGRATIONS) {
      try { db.exec(m); } catch { /* column already exists — fine */ }
    }
  },
};
