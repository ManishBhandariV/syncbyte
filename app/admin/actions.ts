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
