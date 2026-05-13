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

// ── Product meta (brand + display order + image + display name) ──────────────
export async function saveProductMeta(formData: FormData): Promise<void> {
  const productId = String(formData.get("product_id") ?? "");
  const brand = String(formData.get("brand") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const nameOverride = String(formData.get("name_override") ?? "").trim();
  if (!productId) return;

  const db = await getDb();
  const existing = await db.get<{ id: number }>(
    "SELECT id FROM product_meta WHERE product_id = ?",
    [productId],
  );
  if (existing) {
    await db.run(
      "UPDATE product_meta SET brand = ?, display_order = ?, name_override = ? WHERE product_id = ?",
      [brand || null, displayOrder, nameOverride || null, productId],
    );
  } else {
    await db.run(
      "INSERT INTO product_meta (product_id, brand, display_order, name_override) VALUES (?, ?, ?, ?)",
      [productId, brand || null, displayOrder, nameOverride || null],
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

// ── Gallery: project photos ───────────────────────────────────────────────────
function requireBlob(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob isn't configured. Install Blob on Vercel " +
        "(Dashboard → Storage → Create → Blob → Connect to project) — " +
        "it auto-injects BLOB_READ_WRITE_TOKEN.",
    );
  }
}

export async function uploadGalleryImage(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const file = formData.get("image") as File | null;
  if (!title || !file || file.size === 0) return;

  requireBlob();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeTitle = toSlug(title) || "image";
  const blob = await put(
    `gallery/${safeTitle}-${Date.now()}.${ext}`,
    file,
    { access: "public", contentType: file.type || undefined },
  );

  const db = await getDb();
  await db.run(
    "INSERT INTO gallery_images (image_url, title, location, display_order) VALUES (?, ?, ?, ?)",
    [blob.url, title, location || null, displayOrder],
  );
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function updateGalleryImage(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (id <= 0 || !title) return;
  const db = await getDb();
  await db.run(
    "UPDATE gallery_images SET title = ?, location = ?, display_order = ? WHERE id = ?",
    [title, location || null, displayOrder, id],
  );
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function deleteGalleryImage(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM gallery_images WHERE id = ?", [id]);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

// ── Gallery: pinned YouTube videos ────────────────────────────────────────────
/**
 * Extract the 11-char YouTube video id from any common URL shape.
 * Returns null if the input doesn't look like one.
 */
function extractYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,            // watch?v=...
    /youtu\.be\/([A-Za-z0-9_-]{11})/,        // youtu.be/...
    /\/embed\/([A-Za-z0-9_-]{11})/,          // /embed/...
    /\/shorts\/([A-Za-z0-9_-]{11})/,         // /shorts/...
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

export async function saveGalleryVideo(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const rawUrl = String(formData.get("youtube_url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const youtubeId = extractYouTubeId(rawUrl);
  if (!youtubeId || !title) return;

  const db = await getDb();
  if (id > 0) {
    await db.run(
      "UPDATE gallery_videos SET youtube_id = ?, title = ?, display_order = ? WHERE id = ?",
      [youtubeId, title, displayOrder, id],
    );
  } else {
    await db.run(
      "INSERT INTO gallery_videos (youtube_id, title, display_order) VALUES (?, ?, ?)",
      [youtubeId, title, displayOrder],
    );
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function deleteGalleryVideo(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM gallery_videos WHERE id = ?", [id]);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

// ── Brand logos ───────────────────────────────────────────────────────────────
export async function uploadBrandLogo(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const brandSlug = String(formData.get("brand_slug") ?? "").trim();
  const file = formData.get("logo") as File | null;
  if (!brandSlug || !file || file.size === 0) return;

  requireBlob();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const blob = await put(
    `brands/${brandSlug}-${Date.now()}.${ext}`,
    file,
    { access: "public", contentType: file.type || undefined },
  );

  const db = await getDb();
  const existing = await db.get<{ brand_slug: string }>(
    "SELECT brand_slug FROM brand_logos WHERE brand_slug = ?",
    [brandSlug],
  );
  if (existing) {
    await db.run(
      "UPDATE brand_logos SET logo_url = ? WHERE brand_slug = ?",
      [blob.url, brandSlug],
    );
  } else {
    await db.run(
      "INSERT INTO brand_logos (brand_slug, logo_url) VALUES (?, ?)",
      [brandSlug, blob.url],
    );
  }
  revalidatePath("/admin/brands");
  revalidatePath("/");
  revalidatePath("/products", "layout");
}

export async function clearBrandLogo(formData: FormData): Promise<void> {
  const brandSlug = String(formData.get("brand_slug") ?? "").trim();
  if (!brandSlug) return;
  const db = await getDb();
  await db.run("DELETE FROM brand_logos WHERE brand_slug = ?", [brandSlug]);
  revalidatePath("/admin/brands");
  revalidatePath("/");
}
