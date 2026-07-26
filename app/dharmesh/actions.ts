"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { setDharmeshSession, clearDharmeshSession } from "@/lib/auth";
import type { AdminUser } from "@/lib/db/types";

export type LoginResult = { ok: boolean; error?: string };

export async function dharmeshLogin(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { ok: false, error: "Username and password are required." };
  }
  // Validated against the bcrypt hash in admin_users (role 'dharmesh'), exactly
  // like the main admin login.
  const db = await getDb();
  const user = await db.get<AdminUser>(
    "SELECT id, username, password_hash FROM admin_users WHERE username = ? AND role = 'dharmesh'",
    [username],
  );
  if (!user) {
    return { ok: false, error: "Invalid username or password." };
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return { ok: false, error: "Invalid username or password." };
  }
  await setDharmeshSession(user.username);
  redirect("/dharmesh/quotes");
}

export async function dharmeshLogout(): Promise<void> {
  await clearDharmeshSession();
  redirect("/dharmesh");
}
