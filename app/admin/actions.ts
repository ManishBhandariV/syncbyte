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
/** Generic result for admin form submissions — drives the success/error banner. */
export type ActionResult = { ok: boolean; message: string };

const RESULT_OK = (message: string): ActionResult => ({ ok: true, message });
const RESULT_ERR = (message: string): ActionResult => ({ ok: false, message });

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

/**
 * Upload a downloadable file (PDF, doc, etc.) to Vercel Blob and insert a
 * product_downloads row pointing at the resulting URL.
 */
export async function uploadDownload(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");

  const productId = String(formData.get("product_id") ?? "");
  const title = String(formData.get("file_title") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!productId) return RESULT_ERR("Missing product id.");
  if (!title) return RESULT_ERR("Title is required.");

  const file = formData.get("file");
  const fileErr = validateAnyUploadedFile(file, "File");
  if (fileErr) return RESULT_ERR(fileErr);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return RESULT_ERR("Vercel Blob isn't configured.");
  }

  try {
    const f = file as File;
    const ext = f.name.includes(".") ? f.name.split(".").pop() : "bin";
    const blob = await put(
      `downloads/${toSlug(productId)}-${toSlug(title)}-${Date.now()}.${ext}`,
      f,
      { access: "public", contentType: f.type || undefined },
    );
    const fileType = fileTypeFromMime(f.type ?? "");
    const fileSize = humanFileSize(f.size);

    const db = await getDb();
    await db.run(
      "INSERT INTO product_downloads (product_id, file_title, file_url, file_type, file_size, display_order) VALUES (?, ?, ?, ?, ?, ?)",
      [productId, title, blob.url, fileType, fileSize, displayOrder],
    );
    revalidatePath("/admin");
    revalidatePath("/products", "layout");
    return RESULT_OK(`Uploaded "${title}" (${fileSize}).`);
  } catch (e) {
    console.error("[uploadDownload]", e);
    return RESULT_ERR(`Upload failed: ${(e as Error).message}`);
  }
}

// ── Product meta (brand + display order + image + display name) ──────────────
export async function saveProductMeta(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("product_id") ?? "");
  const brand = String(formData.get("brand") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const nameOverride = String(formData.get("name_override") ?? "").trim();
  if (!productId) return RESULT_ERR("Missing product id.");

  try {
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
    return RESULT_OK(`Saved brand=${brand || "(none)"}, order=${displayOrder}.`);
  } catch (e) {
    console.error("[saveProductMeta]", e);
    return RESULT_ERR(`Save failed: ${(e as Error).message}`);
  }
}

/** Guard rails for image uploads. Returns null if the file is usable, else an error message. */
function validateUploadedFile(file: unknown, label: string): string | null {
  if (!(file instanceof File)) return `${label}: no file selected.`;
  if (!file.name || file.name.trim() === "") return `${label}: empty filename.`;
  if (file.size === 0) return `${label}: file is empty (0 bytes).`;
  if (file.size > 8 * 1024 * 1024) return `${label}: file too large (max 8 MB).`;
  if (!file.type.startsWith("image/")) {
    return `${label}: only image files allowed (got ${file.type || "unknown type"}).`;
  }
  return null;
}

/** Looser validation for documents (PDFs, etc.) — any file type accepted. */
function validateAnyUploadedFile(file: unknown, label: string): string | null {
  if (!(file instanceof File)) return `${label}: no file selected.`;
  if (!file.name || file.name.trim() === "") return `${label}: empty filename.`;
  if (file.size === 0) return `${label}: file is empty (0 bytes).`;
  if (file.size > 8 * 1024 * 1024) return `${label}: file too large (max 8 MB).`;
  return null;
}

function fileTypeFromMime(mime: string): "pdf" | "doc" | "image" | "other" {
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("word") || mime.includes("msword") || mime.includes("officedocument.wordprocessingml")) return "doc";
  if (mime.startsWith("image/")) return "image";
  return "other";
}

function humanFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/**
 * Upload an image file to Vercel Blob and store the URL on product_meta.image_url.
 * The product detail page will use this URL as the primary image.
 */
export async function uploadProductImage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");

  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return RESULT_ERR("Missing product id.");

  const file = formData.get("image");
  const fileErr = validateUploadedFile(file, "Image");
  if (fileErr) return RESULT_ERR(fileErr);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return RESULT_ERR(
      "Vercel Blob isn't configured. Connect a Blob store on Vercel Storage and redeploy.",
    );
  }

  try {
    const f = file as File;
    const ext = f.name.includes(".") ? f.name.split(".").pop() : "bin";
    const blob = await put(`products/${toSlug(productId)}-${Date.now()}.${ext}`, f, {
      access: "public",
      contentType: f.type || undefined,
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
    return RESULT_OK(`Image uploaded (${Math.round(f.size / 1024)} KB).`);
  } catch (e) {
    console.error("[uploadProductImage]", e);
    return RESULT_ERR(`Upload failed: ${(e as Error).message}`);
  }
}

export async function clearProductImage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return RESULT_ERR("Missing product id.");
  try {
    const db = await getDb();
    await db.run(
      "UPDATE product_meta SET image_url = NULL WHERE product_id = ?",
      [productId],
    );
    revalidatePath("/admin");
    revalidatePath("/products", "layout");
    return RESULT_OK("Custom image cleared.");
  } catch (e) {
    console.error("[clearProductImage]", e);
    return RESULT_ERR(`Failed: ${(e as Error).message}`);
  }
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
export async function uploadBrandLogo(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");

  const brandSlug = String(formData.get("brand_slug") ?? "").trim();
  if (!brandSlug) return RESULT_ERR("Missing brand slug.");

  const file = formData.get("logo");
  const fileErr = validateUploadedFile(file, "Logo");
  if (fileErr) return RESULT_ERR(fileErr);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return RESULT_ERR("Vercel Blob isn't configured. Connect a Blob store and redeploy.");
  }

  try {
    const f = file as File;
    const ext = f.name.includes(".") ? f.name.split(".").pop() : "png";
    const blob = await put(
      `brands/${brandSlug}-${Date.now()}.${ext}`,
      f,
      { access: "public", contentType: f.type || undefined },
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
    return RESULT_OK(`Logo uploaded for ${brandSlug} (${Math.round(f.size / 1024)} KB).`);
  } catch (e) {
    console.error("[uploadBrandLogo]", e);
    return RESULT_ERR(`Upload failed: ${(e as Error).message}`);
  }
}

export async function clearBrandLogo(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const brandSlug = String(formData.get("brand_slug") ?? "").trim();
  if (!brandSlug) return RESULT_ERR("Missing brand slug.");
  try {
    const db = await getDb();
    await db.run("DELETE FROM brand_logos WHERE brand_slug = ?", [brandSlug]);
    revalidatePath("/admin/brands");
    revalidatePath("/");
    return RESULT_OK(`Logo cleared for ${brandSlug}.`);
  } catch (e) {
    console.error("[clearBrandLogo]", e);
    return RESULT_ERR(`Failed: ${(e as Error).message}`);
  }
}

// ── Product features (admin-editable) ─────────────────────────────────────────
export async function saveFeature(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const productId = String(formData.get("product_id") ?? "");
  const feature = String(formData.get("feature") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!productId || !feature) return;

  const db = await getDb();
  if (id > 0) {
    await db.run(
      "UPDATE product_features SET feature = ?, display_order = ? WHERE id = ?",
      [feature, displayOrder, id],
    );
  } else {
    await db.run(
      "INSERT INTO product_features (product_id, feature, display_order) VALUES (?, ?, ?)",
      [productId, feature, displayOrder],
    );
  }
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
}

export async function deleteFeature(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM product_features WHERE id = ?", [id]);
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
}

// ── Custom products (admin-added) + hide/unhide static ones ───────────────────
export async function addCustomProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("product_id") ?? "").trim();
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const shortDesc = String(formData.get("short_desc") ?? "").trim();
  if (!productId || !categorySlug || !name) {
    return RESULT_ERR("Product ID, category, and name are required.");
  }
  if (!/^[A-Za-z0-9_+\-.&]+$/.test(productId)) {
    return RESULT_ERR(
      "Product ID can only contain letters, digits, and these chars: _ + - . &",
    );
  }
  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO custom_products (product_id, category_slug, name, short_desc) VALUES (?, ?, ?, ?)",
      [productId, categorySlug, name, shortDesc || null],
    );
    revalidatePath("/admin");
    revalidatePath("/products", "layout");
    revalidatePath("/");
    return RESULT_OK(`Product "${name}" added to ${categorySlug}.`);
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[addCustomProduct]", e);
    if (msg.includes("UNIQUE") || msg.includes("duplicate")) {
      return RESULT_ERR(`A product with ID "${productId}" already exists.`);
    }
    return RESULT_ERR(`Add failed: ${msg}`);
  }
}

export async function deleteCustomProduct(formData: FormData): Promise<void> {
  const productId = String(formData.get("product_id") ?? "").trim();
  if (!productId) return;
  const db = await getDb();
  // Cascade: remove the product + all its meta/specs/downloads/features.
  await db.run("DELETE FROM custom_products WHERE product_id = ?", [productId]);
  await db.run("DELETE FROM product_meta WHERE product_id = ?", [productId]);
  await db.run("DELETE FROM product_specs WHERE product_id = ?", [productId]);
  await db.run("DELETE FROM product_downloads WHERE product_id = ?", [productId]);
  await db.run("DELETE FROM product_features WHERE product_id = ?", [productId]);
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
  revalidatePath("/");
}

// ── Custom brands (admin-added) ───────────────────────────────────────────────
export async function addCustomBrand(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return RESULT_ERR("Brand name is required.");
  const slug = toSlug(name);
  if (!slug) return RESULT_ERR("Brand name produces an invalid slug.");
  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO custom_brands (slug, name) VALUES (?, ?)",
      [slug, name],
    );
    revalidatePath("/admin/brands");
    revalidatePath("/");
    revalidatePath("/products", "layout");
    return RESULT_OK(`Brand "${name}" added.`);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("UNIQUE") || msg.includes("duplicate")) {
      return RESULT_ERR(`A brand with that name already exists.`);
    }
    console.error("[addCustomBrand]", e);
    return RESULT_ERR(`Add failed: ${msg}`);
  }
}

export async function deleteCustomBrand(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;
  const db = await getDb();
  await db.run("DELETE FROM custom_brands WHERE slug = ?", [slug]);
  await db.run("DELETE FROM brand_logos WHERE brand_slug = ?", [slug]);
  // Clear the brand tag from any products tagged with this brand's name.
  // (Best-effort — products keep no FK to the brand row.)
  revalidatePath("/admin/brands");
  revalidatePath("/");
  revalidatePath("/products", "layout");
}

// ── Custom categories (admin-added) ───────────────────────────────────────────
export async function addCustomCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "fa-folder";
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return RESULT_ERR("Category name is required.");
  const slug = toSlug(name);
  if (!slug) return RESULT_ERR("Category name produces an invalid slug.");

  // Reject if it collides with an existing static category slug.
  const { productCategories } = await import("@/lib/data/products");
  if (productCategories[slug]) {
    return RESULT_ERR(
      `A built-in category with slug "${slug}" already exists. Pick a different name.`,
    );
  }

  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO custom_categories (slug, name, icon, description) VALUES (?, ?, ?, ?)",
      [slug, name, icon, description],
    );
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/products", "layout");
    return RESULT_OK(`Category "${name}" added.`);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("UNIQUE") || msg.includes("duplicate")) {
      return RESULT_ERR(`A category with slug "${slug}" already exists.`);
    }
    console.error("[addCustomCategory]", e);
    return RESULT_ERR(`Add failed: ${msg}`);
  }
}

export async function deleteCustomCategory(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;
  const db = await getDb();
  // Refuse to delete if it still has custom products attached.
  const count = (
    await db.get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM custom_products WHERE category_slug = ?",
      [slug],
    )
  )?.c ?? 0;
  if (count > 0) {
    // We can't return a value from a non-action form, so just bail.
    // The page will refresh and the user will see the category is still there.
    console.warn(
      `[deleteCustomCategory] refused — ${count} custom products still in "${slug}"`,
    );
    return;
  }
  // Also clear any category_override values that point to this slug.
  await db.run(
    "UPDATE product_meta SET category_override = NULL WHERE category_override = ?",
    [slug],
  );
  await db.run("DELETE FROM custom_categories WHERE slug = ?", [slug]);
  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/products", "layout");
}

/**
 * Move a product (static or custom) to a different category.
 *  - Static products: writes `category_override` on product_meta.
 *  - Custom products: updates `category_slug` on custom_products directly.
 */
export async function changeProductCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("product_id") ?? "").trim();
  const newCategory = String(formData.get("category_slug") ?? "").trim();
  const isCustom = String(formData.get("is_custom") ?? "") === "1";
  if (!productId || !newCategory) {
    return RESULT_ERR("Product and category are required.");
  }

  // Validate the target category exists (static or custom).
  const { productCategories } = await import("@/lib/data/products");
  const db = await getDb();
  let valid = !!productCategories[newCategory];
  if (!valid) {
    const row = await db.get<{ slug: string }>(
      "SELECT slug FROM custom_categories WHERE slug = ?",
      [newCategory],
    );
    valid = !!row;
  }
  if (!valid) return RESULT_ERR(`Unknown category "${newCategory}".`);

  try {
    if (isCustom) {
      await db.run(
        "UPDATE custom_products SET category_slug = ? WHERE product_id = ?",
        [newCategory, productId],
      );
    } else {
      // Upsert product_meta with category_override.
      const existing = await db.get<{ id: number }>(
        "SELECT id FROM product_meta WHERE product_id = ?",
        [productId],
      );
      if (existing) {
        await db.run(
          "UPDATE product_meta SET category_override = ? WHERE product_id = ?",
          [newCategory, productId],
        );
      } else {
        await db.run(
          "INSERT INTO product_meta (product_id, category_override) VALUES (?, ?)",
          [productId, newCategory],
        );
      }
    }
    revalidatePath("/admin");
    revalidatePath("/admin/categories");
    revalidatePath("/products", "layout");
    revalidatePath("/");
    return RESULT_OK(`Moved "${productId}" to ${newCategory}.`);
  } catch (e) {
    console.error("[changeProductCategory]", e);
    return RESULT_ERR(`Move failed: ${(e as Error).message}`);
  }
}

// ── Bulk product import (CSV upload) ─────────────────────────────────────────
export type ImportSummary = {
  ok: boolean;
  message: string;
  totals?: {
    rows: number;
    metaUpserted: number;
    customsAdded: number;
    customBrandsAdded: number;
    errors: string[];
  };
};

function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let i = 0, cell = "", row: string[] = [], inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 2; continue; }
      if (c === '"') { inQ = false; i++; continue; }
      cell += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(cell); cell = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(cell); out.push(row); row = []; cell = ""; i++; continue; }
    cell += c; i++;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); out.push(row); }
  return out;
}

const BUNDLED_BRANDS = new Set([
  "eSSL", "Biomax", "ZKTeco", "Hikvision", "CP Plus",
  "Ajax Systems", "UNV", "Smart Office Payroll", "Galaxy", "Panasonic",
]);

export async function importProductsCsv(
  _prev: ImportSummary | null,
  formData: FormData,
): Promise<ImportSummary> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Unauthorized." };

  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pick a CSV file first." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, message: "CSV too large (max 8 MB)." };
  }

  const text = (await file.text()).replace(/^﻿/, "");
  const rows = parseCsv(text).filter((r) => r.length >= 7);
  if (rows.length < 2) return { ok: false, message: "CSV looks empty." };

  // Lazy import the static catalog so we can decide existing vs. custom.
  const productsMod = await import("@/lib/data/products");
  const { productCategories } = productsMod;
  const catNameToSlug = new Map<string, string>();
  const staticIds = new Set<string>();
  const staticNames = new Map<string, string>();
  for (const [slug, cat] of Object.entries(productCategories)) {
    catNameToSlug.set(cat.name, slug);
    for (const p of cat.products) {
      staticIds.add(p.id);
      staticNames.set(p.id, p.name);
    }
  }
  // Include admin-added custom categories so the CSV can reference them by name.
  try {
    const dbForCats = await getDb();
    const customCats = await dbForCats.all<{ slug: string; name: string }>(
      "SELECT slug, name FROM custom_categories",
    );
    for (const c of customCats) {
      if (!catNameToSlug.has(c.name)) catNameToSlug.set(c.name, c.slug);
    }
  } catch (e) {
    console.warn("[importProductsCsv] custom_categories read failed", e);
  }

  const errors: string[] = [];
  const customsToInsert: Array<{ product_id: string; category_slug: string; name: string; short_desc: string }> = [];
  const metaToWrite: Array<{ product_id: string; brand: string | null; name_override: string | null; is_hidden: number }> = [];
  const customBrands = new Set<string>();

  // Skip header row.
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const [categoryName, productId, name, displayName, brand, custom, hidden] = r;
    if (!productId) continue;
    const isHidden = (hidden || "").trim().toLowerCase() === "yes" ? 1 : 0;
    const isCustom = (custom || "").trim().toLowerCase() === "yes";
    const brandClean = (brand || "").trim();
    if (brandClean && !BUNDLED_BRANDS.has(brandClean)) customBrands.add(brandClean);

    if (staticIds.has(productId)) {
      const staticName = staticNames.get(productId) ?? "";
      const want = (displayName || "").trim();
      const nameOverride = want && want !== staticName ? want : null;
      metaToWrite.push({
        product_id: productId,
        brand: brandClean || null,
        name_override: nameOverride,
        is_hidden: isHidden,
      });
      continue;
    }
    if (!isCustom) {
      errors.push(`Row ${i + 1}: "${productId}" not in catalog and Custom!=yes — skipped.`);
      continue;
    }
    const catSlug = catNameToSlug.get(categoryName);
    if (!catSlug) {
      errors.push(`Row ${i + 1}: unknown category "${categoryName}" for "${productId}".`);
      continue;
    }
    const cleanName = (name || productId).trim();
    customsToInsert.push({
      product_id: productId,
      category_slug: catSlug,
      name: cleanName,
      short_desc: (displayName || cleanName).trim(),
    });
    metaToWrite.push({
      product_id: productId,
      brand: brandClean || null,
      name_override:
        (displayName || "").trim() && (displayName || "").trim() !== cleanName
          ? (displayName || "").trim()
          : null,
      is_hidden: isHidden,
    });
  }

  const db = await getDb();
  let customBrandsAdded = 0, customsAdded = 0, metaUpserted = 0;

  for (const brandName of customBrands) {
    const slug = toSlug(brandName);
    try {
      const existing = await db.get<{ slug: string }>(
        "SELECT slug FROM custom_brands WHERE slug = ?",
        [slug],
      );
      if (!existing) {
        await db.run(
          "INSERT INTO custom_brands (slug, name) VALUES (?, ?)",
          [slug, brandName],
        );
        customBrandsAdded++;
      }
    } catch (e) {
      errors.push(`custom_brand ${brandName}: ${(e as Error).message}`);
    }
  }

  for (const c of customsToInsert) {
    try {
      const existing = await db.get<{ id: number }>(
        "SELECT id FROM custom_products WHERE product_id = ?",
        [c.product_id],
      );
      if (existing) {
        await db.run(
          "UPDATE custom_products SET category_slug = ?, name = ?, short_desc = ? WHERE product_id = ?",
          [c.category_slug, c.name, c.short_desc, c.product_id],
        );
      } else {
        await db.run(
          "INSERT INTO custom_products (product_id, category_slug, name, short_desc) VALUES (?, ?, ?, ?)",
          [c.product_id, c.category_slug, c.name, c.short_desc],
        );
      }
      customsAdded++;
    } catch (e) {
      errors.push(`custom_product ${c.product_id}: ${(e as Error).message}`);
    }
  }

  for (const m of metaToWrite) {
    try {
      const existing = await db.get<{ id: number }>(
        "SELECT id FROM product_meta WHERE product_id = ?",
        [m.product_id],
      );
      if (existing) {
        await db.run(
          "UPDATE product_meta SET brand = ?, name_override = ?, is_hidden = ? WHERE product_id = ?",
          [m.brand, m.name_override, m.is_hidden, m.product_id],
        );
      } else {
        await db.run(
          "INSERT INTO product_meta (product_id, brand, name_override, is_hidden) VALUES (?, ?, ?, ?)",
          [m.product_id, m.brand, m.name_override, m.is_hidden],
        );
      }
      metaUpserted++;
    } catch (e) {
      errors.push(`product_meta ${m.product_id}: ${(e as Error).message}`);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/brands");
  revalidatePath("/products", "layout");
  revalidatePath("/");

  return {
    ok: errors.length === 0,
    message:
      errors.length === 0
        ? `Imported ${rows.length - 1} rows successfully.`
        : `Imported with ${errors.length} error${errors.length === 1 ? "" : "s"}.`,
    totals: {
      rows: rows.length - 1,
      metaUpserted,
      customsAdded,
      customBrandsAdded,
      errors,
    },
  };
}

// ── Featured products (home page) ─────────────────────────────────────────────
export async function addFeatured(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("product_id") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!productId) return RESULT_ERR("Pick a product.");
  try {
    const db = await getDb();
    const existing = await db.get<{ id: number }>(
      "SELECT id FROM featured_products WHERE product_id = ?",
      [productId],
    );
    if (existing) {
      await db.run(
        "UPDATE featured_products SET display_order = ? WHERE product_id = ?",
        [displayOrder, productId],
      );
    } else {
      await db.run(
        "INSERT INTO featured_products (product_id, display_order) VALUES (?, ?)",
        [productId, displayOrder],
      );
    }
    revalidatePath("/admin/featured");
    revalidatePath("/");
    return RESULT_OK("Featured products updated.");
  } catch (e) {
    console.error("[addFeatured]", e);
    return RESULT_ERR(`Failed: ${(e as Error).message}`);
  }
}

export async function removeFeatured(formData: FormData): Promise<void> {
  const productId = String(formData.get("product_id") ?? "").trim();
  if (!productId) return;
  const db = await getDb();
  await db.run("DELETE FROM featured_products WHERE product_id = ?", [productId]);
  revalidatePath("/admin/featured");
  revalidatePath("/");
}

// ── Carousel slides (hero) ────────────────────────────────────────────────────
export async function uploadCarouselSlide(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");

  const buttonLabel = String(formData.get("button_label") ?? "").trim() || "Explore";
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const file = formData.get("image");
  const fileErr = validateUploadedFile(file, "Slide image");
  if (fileErr) return RESULT_ERR(fileErr);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return RESULT_ERR("Vercel Blob isn't configured.");
  }
  try {
    const f = file as File;
    const ext = f.name.includes(".") ? f.name.split(".").pop() : "jpg";
    const blob = await put(`carousel/slide-${Date.now()}.${ext}`, f, {
      access: "public",
      contentType: f.type || undefined,
    });
    const db = await getDb();
    await db.run(
      "INSERT INTO carousel_slides (image_url, button_label, category_slug, display_order) VALUES (?, ?, ?, ?)",
      [blob.url, buttonLabel, categorySlug, displayOrder],
    );
    revalidatePath("/admin/carousel");
    revalidatePath("/");
    return RESULT_OK("Carousel slide added.");
  } catch (e) {
    console.error("[uploadCarouselSlide]", e);
    return RESULT_ERR(`Upload failed: ${(e as Error).message}`);
  }
}

export async function updateCarouselSlide(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const buttonLabel = String(formData.get("button_label") ?? "").trim() || "Explore";
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run(
    "UPDATE carousel_slides SET button_label = ?, category_slug = ?, display_order = ? WHERE id = ?",
    [buttonLabel, categorySlug, displayOrder, id],
  );
  revalidatePath("/admin/carousel");
  revalidatePath("/");
}

export async function deleteCarouselSlide(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM carousel_slides WHERE id = ?", [id]);
  revalidatePath("/admin/carousel");
  revalidatePath("/");
}

// ── Site downloads (public /downloads page) ───────────────────────────────────
export async function uploadSiteDownload(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Other";
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!title) return RESULT_ERR("Title is required.");
  const file = formData.get("file");
  const fileErr = validateAnyUploadedFile(file, "File");
  if (fileErr) return RESULT_ERR(fileErr);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return RESULT_ERR("Vercel Blob isn't configured.");
  }
  try {
    const f = file as File;
    const ext = f.name.includes(".") ? f.name.split(".").pop() : "bin";
    const blob = await put(`site-downloads/${toSlug(title)}-${Date.now()}.${ext}`, f, {
      access: "public",
      contentType: f.type || undefined,
    });
    const db = await getDb();
    await db.run(
      "INSERT INTO site_downloads (title, description, file_url, file_type, file_size, category, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, description || null, blob.url, fileTypeFromMime(f.type ?? ""), humanFileSize(f.size), category, displayOrder],
    );
    revalidatePath("/admin/downloads-page");
    revalidatePath("/downloads");
    return RESULT_OK(`Uploaded "${title}".`);
  } catch (e) {
    console.error("[uploadSiteDownload]", e);
    return RESULT_ERR(`Upload failed: ${(e as Error).message}`);
  }
}

/**
 * Same as uploadSiteDownload but the file is already in Vercel Blob.
 * Used for client-side direct uploads to support files >4.5 MB
 * (the Server Action body-size limit on Vercel).
 */
export async function addSiteDownloadFromUrl(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Other";
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const sizeBytes = Number(formData.get("size") ?? 0);
  const mime = String(formData.get("mime") ?? "");
  if (!title) return RESULT_ERR("Title is required.");
  if (!fileUrl.startsWith("https://")) return RESULT_ERR("Invalid file URL.");
  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO site_downloads (title, description, file_url, file_type, file_size, category, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description || null,
        fileUrl,
        fileTypeFromMime(mime),
        humanFileSize(sizeBytes),
        category,
        displayOrder,
      ],
    );
    revalidatePath("/admin/downloads-page");
    revalidatePath("/downloads");
    return RESULT_OK(`Uploaded "${title}".`);
  } catch (e) {
    console.error("[addSiteDownloadFromUrl]", e);
    return RESULT_ERR(`Save failed: ${(e as Error).message}`);
  }
}

export async function updateSiteDownload(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Other";
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (id <= 0 || !title) return;
  const db = await getDb();
  await db.run(
    "UPDATE site_downloads SET title = ?, description = ?, category = ?, display_order = ? WHERE id = ?",
    [title, description || null, category, displayOrder, id],
  );
  revalidatePath("/admin/downloads-page");
  revalidatePath("/downloads");
}

export async function deleteSiteDownload(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM site_downloads WHERE id = ?", [id]);
  revalidatePath("/admin/downloads-page");
  revalidatePath("/downloads");
}

// ── Product images (up to 3) ──────────────────────────────────────────────────
const MAX_PRODUCT_IMAGES = 3;

export async function addProductImage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");
  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return RESULT_ERR("Missing product id.");
  const file = formData.get("image");
  const fileErr = validateUploadedFile(file, "Image");
  if (fileErr) return RESULT_ERR(fileErr);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return RESULT_ERR("Vercel Blob isn't configured.");
  }
  try {
    const db = await getDb();
    const countRow = await db.get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM product_images WHERE product_id = ?",
      [productId],
    );
    if ((countRow?.c ?? 0) >= MAX_PRODUCT_IMAGES) {
      return RESULT_ERR(`Maximum ${MAX_PRODUCT_IMAGES} images per product. Delete one first.`);
    }
    const f = file as File;
    const ext = f.name.includes(".") ? f.name.split(".").pop() : "jpg";
    const blob = await put(`products/${toSlug(productId)}-${Date.now()}.${ext}`, f, {
      access: "public",
      contentType: f.type || undefined,
    });
    await db.run(
      "INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)",
      [productId, blob.url, (countRow?.c ?? 0)],
    );
    revalidatePath("/admin");
    revalidatePath("/products", "layout");
    revalidatePath("/");
    return RESULT_OK(`Image added (${Math.round(f.size / 1024)} KB).`);
  } catch (e) {
    console.error("[addProductImage]", e);
    return RESULT_ERR(`Upload failed: ${(e as Error).message}`);
  }
}

/**
 * Same as addProductImage but the file is already in Vercel Blob — the caller
 * passes the blob URL + size + content-type. Used by the client-side upload
 * path so we don't have to push the file bytes through a Server Action.
 */
export async function addProductImageFromUrl(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return RESULT_ERR("Unauthorized.");
  const productId = String(formData.get("product_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const sizeBytes = Number(formData.get("size") ?? 0);
  if (!productId) return RESULT_ERR("Missing product id.");
  if (!imageUrl.startsWith("https://")) return RESULT_ERR("Invalid image URL.");
  try {
    const db = await getDb();
    const countRow = await db.get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM product_images WHERE product_id = ?",
      [productId],
    );
    if ((countRow?.c ?? 0) >= MAX_PRODUCT_IMAGES) {
      return RESULT_ERR(
        `Maximum ${MAX_PRODUCT_IMAGES} images per product. Delete one first.`,
      );
    }
    await db.run(
      "INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)",
      [productId, imageUrl, countRow?.c ?? 0],
    );
    revalidatePath("/admin");
    revalidatePath("/products", "layout");
    revalidatePath("/");
    const sizeLabel = sizeBytes > 0 ? ` (${Math.round(sizeBytes / 1024)} KB)` : "";
    return RESULT_OK(`Image added${sizeLabel}.`);
  } catch (e) {
    console.error("[addProductImageFromUrl]", e);
    return RESULT_ERR(`Save failed: ${(e as Error).message}`);
  }
}

export async function deleteProductImage(formData: FormData): Promise<void> {
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM product_images WHERE id = ?", [id]);
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
  revalidatePath("/");
}

/**
 * Hide / unhide a *static* product. Custom products should be deleted instead.
 * Hidden products are filtered out of all public listings.
 */
export async function setProductHidden(formData: FormData): Promise<void> {
  const productId = String(formData.get("product_id") ?? "").trim();
  const hidden = String(formData.get("hidden") ?? "0") === "1";
  if (!productId) return;
  const db = await getDb();
  const existing = await db.get<{ id: number }>(
    "SELECT id FROM product_meta WHERE product_id = ?",
    [productId],
  );
  if (existing) {
    await db.run(
      "UPDATE product_meta SET is_hidden = ? WHERE product_id = ?",
      [hidden ? 1 : 0, productId],
    );
  } else {
    await db.run(
      "INSERT INTO product_meta (product_id, is_hidden) VALUES (?, ?)",
      [productId, hidden ? 1 : 0],
    );
  }
  revalidatePath("/admin");
  revalidatePath("/products", "layout");
  revalidatePath("/");
}
