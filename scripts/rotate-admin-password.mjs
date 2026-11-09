/**
 * Replaces an admin_users password hash.
 *
 * Needed because seedUser() in lib/db/index.ts only INSERTs when the username
 * does not already exist:
 *
 *     const existing = await driver.get(... WHERE username = ?);
 *     if (existing) return;
 *
 * So setting ADMIN_PASSWORD in Vercel does NOT change an account that has
 * already been seeded — the old hash stays in the database forever. The env var
 * only governs future seeds. This script changes the stored hash directly.
 *
 * Usage (never put the password in argv — it lands in your shell history):
 *   vercel env pull .env.local
 *   NEW_PASSWORD='...' node --env-file=.env.local scripts/rotate-admin-password.mjs admin
 *
 * Then set the matching env var in Vercel so a fresh database seeds the same way:
 *   vercel env add ADMIN_PASSWORD production
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const username = process.argv[2];
const password = process.env.NEW_PASSWORD;

if (!username || !password) {
  console.error("Usage: NEW_PASSWORD='...' node --env-file=.env.local scripts/rotate-admin-password.mjs <username>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Refusing: use at least 12 characters.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const existing = await sql`SELECT id, username, role FROM admin_users WHERE username = ${username}`;
if (existing.length === 0) {
  const all = await sql`SELECT username, role FROM admin_users ORDER BY id`;
  console.error(`No admin_users row for "${username}". Existing accounts:`);
  for (const u of all) console.error(`  ${u.username}  (role=${u.role})`);
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
await sql`UPDATE admin_users SET password_hash = ${hash} WHERE username = ${username}`;

console.log(`Updated password for "${username}" (role=${existing[0].role}).`);
console.log(`Now set ADMIN_PASSWORD (or DHARMESH_PASSWORD) in Vercel to match, so a`);
console.log(`rebuilt database seeds the same credentials instead of the repo defaults.`);
