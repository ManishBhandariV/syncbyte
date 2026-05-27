import bcrypt from "bcryptjs";
import type { DbDriver, AdminUser } from "./types";

let driverPromise: Promise<DbDriver> | null = null;
let initialized = false;

async function loadDriver(): Promise<DbDriver> {
  if (process.env.DATABASE_URL) {
    const mod = await import("./postgres");
    return mod.postgresDriver;
  }
  const mod = await import("./sqlite");
  return mod.sqliteDriver;
}

export async function getDb(): Promise<DbDriver> {
  if (!driverPromise) driverPromise = loadDriver();
  const driver = await driverPromise;
  if (!initialized) {
    await driver.init();
    await seedAdmin(driver);
    initialized = true;
  }
  return driver;
}

async function seedAdmin(driver: DbDriver): Promise<void> {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "syncbyte@admin";

  const existing = await driver.get<AdminUser>(
    "SELECT id FROM admin_users WHERE username = ?",
    [username],
  );
  if (existing) return;

  const hash = await bcrypt.hash(password, 10);
  try {
    await driver.run(
      "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
      [username, hash],
    );
  } catch (e) {
    // Concurrent cold-starts (e.g. parallel build workers) can race here.
    // A UNIQUE violation just means another worker already seeded the admin.
    const msg = (e as Error).message ?? "";
    if (!/unique|duplicate/i.test(msg)) throw e;
  }
}

export type { DbDriver } from "./types";
