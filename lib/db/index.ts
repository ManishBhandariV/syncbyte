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

/**
 * Seeds the admin accounts from environment variables.
 *
 * These used to fall back to literal default passwords. The repository is
 * public, so those defaults were working production credentials for anyone who
 * read this file — and because seedUser() below is a no-op once the username
 * exists, setting the env vars later does NOT change an already-seeded account.
 * Rotate the stored hash with scripts/rotate-admin-password.mjs.
 *
 * Seeding now fails closed: with no password configured, no account is created.
 */
async function seedUsers(driver: DbDriver): Promise<void> {
  await seedUserFromEnv(driver, "ADMIN", "admin", "admin");
  // Dharmesh: quote-only login. Password is bcrypt-hashed in the DB, same as admin.
  await seedUserFromEnv(driver, "DHARMESH", "Syncbyte", "dharmesh");
}

async function seedUserFromEnv(
  driver: DbDriver,
  prefix: "ADMIN" | "DHARMESH",
  defaultUsername: string,
  role: string,
): Promise<void> {
  const password = process.env[`${prefix}_PASSWORD`];
  if (!password) {
    console.warn(
      `[db] ${prefix}_PASSWORD is not set — skipping the "${role}" seed. ` +
        `Existing accounts are unaffected; a fresh database will have no ` +
        `"${role}" login until the variable is configured.`,
    );
    return;
  }
  await seedUser(
    driver,
    process.env[`${prefix}_USERNAME`] ?? defaultUsername,
    password,
    role,
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
