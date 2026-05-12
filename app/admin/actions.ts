"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { clearSession, setSession } from "@/lib/auth";
import type { AdminUser } from "@/lib/db/types";

export type LoginResult = { ok: boolean; error?: string };

export async function login(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { ok: false, error: "Username and password are required." };
  }

  const db = await getDb();
  const user = await db.get<AdminUser>(
    "SELECT id, username, password_hash FROM admin_users WHERE username = ?",
    [username],
  );
  if (!user) {
    return { ok: false, error: "Invalid username or password." };
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return { ok: false, error: "Invalid username or password." };
  }

  await setSession(user.username);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/admin");
}

// ── Product specs ─────────────────────────────────────────────────────────────
export async function saveSpec(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const productId = String(formData.get("product_id") ?? "");
  const specKey = String(formData.get("spec_key") ?? "").trim();
  const specValue = String(formData.get("spec_value") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!productId || !specKey || !specValue) return;

  const db = await getDb();
  if (id > 0) {
    await db.run(
      "UPDATE product_specs SET spec_key = ?, spec_value = ?, display_order = ? WHERE id = ?",
      [specKey, specValue, displayOrder, id],
    );
  } else {
    await db.run(
      "INSERT INTO product_specs (product_id, spec_key, spec_value, display_order) VALUES (?, ?, ?, ?)",
      [productId, specKey, specValue, displayOrder],
    );
  }
  revalidatePath("/admin");
  revalidatePath(`/products/${productId}`);
  // Also revalidate any category pages that might link here
  revalidatePath("/products", "layout");
}

export async function deleteSpec(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const productId = String(formData.get("product_id") ?? "");
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM product_specs WHERE id = ?", [id]);
  revalidatePath("/admin");
  if (productId) revalidatePath("/products", "layout");
}

// ── Product downloads ─────────────────────────────────────────────────────────
export async function saveDownload(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const productId = String(formData.get("product_id") ?? "");
  const title = String(formData.get("file_title") ?? "").trim();
  const url = String(formData.get("file_url") ?? "").trim();
  const type = String(formData.get("file_type") ?? "pdf");
  const size = String(formData.get("file_size") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!productId || !title || !url) return;

  const db = await getDb();
  if (id > 0) {
    await db.run(
      "UPDATE product_downloads SET file_title = ?, file_url = ?, file_type = ?, file_size = ?, display_order = ? WHERE id = ?",
      [title, url, type, size, displayOrder, id],
    );
  } else {
    await db.run(
      "INSERT INTO product_downloads (product_id, file_title, file_url, file_type, file_size, display_order) VALUES (?, ?, ?, ?, ?, ?)",
      [productId, title, url, type, size, displayOrder],
    );
  }
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
}

export async function deleteDownload(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM product_downloads WHERE id = ?", [id]);
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
}
