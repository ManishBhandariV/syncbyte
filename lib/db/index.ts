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
    await seedUsers(driver);
    initialized = true;
  }
  return driver;
}

async function seedUsers(driver: DbDriver): Promise<void> {
  await seedUser(
    driver,
    process.env.ADMIN_USERNAME ?? "admin",
    process.env.ADMIN_PASSWORD ?? "syncbyte@admin",
    "admin",
  );
  // Dharmesh: quote-only login. Password is bcrypt-hashed in the DB, same as admin.
  await seedUser(
    driver,
    process.env.DHARMESH_USERNAME ?? "Syncbyte",
    process.env.DHARMESH_PASSWORD ?? "Kanan@123",
    "dharmesh",
  );
}

async function seedUser(
  driver: DbDriver,
  username: string,
  password: string,
  role: string,
): Promise<void> {
  const existing = await driver.get<AdminUser>(
    "SELECT id FROM admin_users WHERE username = ?",
    [username],
  );
  if (existing) return;

  const hash = await bcrypt.hash(password, 10);
  try {
    await driver.run(
      "INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, hash, role],
    );
  } catch (e) {
    // Concurrent cold-starts (parallel workers) can race — a UNIQUE violation
    // just means another worker already seeded this user.
    const msg = (e as Error).message ?? "";
    if (!/unique|duplicate/i.test(msg)) throw e;
  }
}

export type { DbDriver } from "./types";
