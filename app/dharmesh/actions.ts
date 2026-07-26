"use server";

import { redirect } from "next/navigation";
import { setDharmeshSession, clearDharmeshSession } from "@/lib/auth";

export type LoginResult = { ok: boolean; error?: string };

// Fixed quote-only credentials. Override in prod via env if desired.
const DHARMESH_USER = process.env.DHARMESH_USER ?? "Syncbyte";
const DHARMESH_PASS = process.env.DHARMESH_PASS ?? "Kanan@123";

export async function dharmeshLogin(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { ok: false, error: "Username and password are required." };
  }
  if (username !== DHARMESH_USER || password !== DHARMESH_PASS) {
    return { ok: false, error: "Invalid username or password." };
  }
  await setDharmeshSession(username);
  redirect("/dharmesh/quotes");
}

export async function dharmeshLogout(): Promise<void> {
  await clearDharmeshSession();
  redirect("/dharmesh");
}
