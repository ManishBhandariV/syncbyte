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
  await driver.run(
    "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
    [username, hash],
  );

  // Seed a few sample specs only if the table is empty (matches PHP db_setup.php behaviour)
  const anySpec = await driver.get(
    "SELECT id FROM product_specs LIMIT 1",
    [],
  );
  if (!anySpec) {
    const samples: Array<[string, string, string, number]> = [
      ["K21-Pro", "Fingerprint Capacity", "3,000", 0],
      ["K21-Pro", "Transaction Logs", "1,00,000", 1],
      ["K21-Pro", "Communication", "TCP/IP, USB", 2],
      ["K21-Pro", "Power Supply", "12V DC", 3],
      ["K21-Pro", "Operating Temp", "0°C to 45°C", 4],
    ];
    for (const s of samples) {
      await driver.run(
        "INSERT INTO product_specs (product_id, spec_key, spec_value, display_order) VALUES (?, ?, ?, ?)",
        s,
      );
    }
  }
}

export type { DbDriver } from "./types";
