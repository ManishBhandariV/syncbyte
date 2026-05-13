"use server";

import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { clearSession, setSession, getSession } from "@/lib/auth";
import { toSlug } from "@/lib/data/products";
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

// ── Product meta (brand + display order + image) ──────────────────────────────
export async function saveProductMeta(formData: FormData): Promise<void> {
  const productId = String(formData.get("product_id") ?? "");
  const brand = String(formData.get("brand") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!productId) return;

  const db = await getDb();
  const existing = await db.get<{ id: number }>(
    "SELECT id FROM product_meta WHERE product_id = ?",
    [productId],
  );
  if (existing) {
    await db.run(
      "UPDATE product_meta SET brand = ?, display_order = ? WHERE product_id = ?",
      [brand || null, displayOrder, productId],
    );
  } else {
    await db.run(
      "INSERT INTO product_meta (product_id, brand, display_order) VALUES (?, ?, ?)",
      [productId, brand || null, displayOrder],
    );
  }
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
  revalidatePath("/");
}

/**
 * Upload an image file to Vercel Blob and store the URL on product_meta.image_url.
 * The product detail page will use this URL as the primary image.
 */
export async function uploadProductImage(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const productId = String(formData.get("product_id") ?? "");
  const file = formData.get("image") as File | null;
  if (!productId || !file || file.size === 0) return;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob isn't configured. Install the Blob integration on Vercel " +
        "(Dashboard → Storage → Create Database → Blob) — it auto-injects BLOB_READ_WRITE_TOKEN.",
    );
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const blob = await put(`products/${toSlug(productId)}-${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type || undefined,
  });

  const db = await getDb();
  const existing = await db.get<{ id: number }>(
    "SELECT id FROM product_meta WHERE product_id = ?",
    [productId],
  );
  if (existing) {
    await db.run(
      "UPDATE product_meta SET image_url = ? WHERE product_id = ?",
      [blob.url, productId],
    );
  } else {
    await db.run(
      "INSERT INTO product_meta (product_id, image_url) VALUES (?, ?)",
      [productId, blob.url],
    );
  }
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
  revalidatePath("/");
}

export async function clearProductImage(formData: FormData): Promise<void> {
  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return;
  const db = await getDb();
  await db.run(
    "UPDATE product_meta SET image_url = NULL WHERE product_id = ?",
    [productId],
  );
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
}

// ── Reviews moderation ────────────────────────────────────────────────────────
export async function approveReview(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("UPDATE reviews SET status = 'approved' WHERE id = ?", [id]);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function rejectReview(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("UPDATE reviews SET status = 'rejected' WHERE id = ?", [id]);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function deleteReview(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM reviews WHERE id = ?", [id]);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}
