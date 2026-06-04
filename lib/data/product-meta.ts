import { getDb } from "@/lib/db";
import { getProductImage } from "@/lib/data/images";
import type { ProductMeta } from "@/lib/db/types";

export type ProductMetaMap = Map<
  string,
  {
    brand: string | null;
    display_order: number;
    image_url: string | null;
    name_override: string | null;
    is_hidden: number;
    category_override: string | null;
  }
>;

/**
 * Fetches the per-product overrides set in the admin panel
 * (brand + display order + uploaded image + display name) keyed by product_id.
 *
 * Tolerates DB unavailability — returns an empty map.
 */
export async function loadProductMeta(): Promise<ProductMetaMap> {
  const map: ProductMetaMap = new Map();
  try {
    const db = await getDb();
    const rows = await db.all<ProductMeta>(
      "SELECT product_id, brand, display_order, image_url, name_override, is_hidden, category_override FROM product_meta",
    );
    for (const r of rows) {
      map.set(r.product_id, {
        brand: r.brand,
        display_order: r.display_order,
        image_url: r.image_url,
        name_override: r.name_override,
        is_hidden: r.is_hidden ?? 0,
        category_override: r.category_override ?? null,
      });
    }
  } catch (e) {
    console.warn("[product-meta] DB read failed", e);
  }
  return map;
}

/** Display name: admin override if set (and non-empty), else the static name. */
export function displayName(
  product: { id: string; name: string },
  meta: ProductMetaMap,
): string {
  const override = meta.get(product.id)?.name_override;
  return override && override.trim().length > 0 ? override : product.name;
}

export function getMetaImage(productId: string, meta: ProductMetaMap): string | null {
  return meta.get(productId)?.image_url ?? null;
}

/**
 * Returns the best image URL for a product:
 *   1. first admin-uploaded multi-image (product_images), if a map is provided
 *   2. legacy single uploaded image (product_meta.image_url)
 *   3. bundled /public/images/products file
 *   4. placeholder
 */
export function bestProductImage(
  productId: string,
  meta: ProductMetaMap,
  imagesMap?: Map<string, string[]>,
): string {
  const imgs = imagesMap?.get(productId);
  if (imgs && imgs.length > 0) return imgs[0];
  return meta.get(productId)?.image_url ?? getProductImage(productId);
}

/**
 * Stable sort helper: orders products by display_order asc,
 * falling back to the existing static order (preserved via originalIndex).
 */
export function sortByMeta<T extends { id: string }>(
  products: T[],
  meta: ProductMetaMap,
): T[] {
  return [...products]
    .map((p, originalIndex) => ({
      p,
      originalIndex,
      order: meta.get(p.id)?.display_order ?? 9999,
    }))
    .sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex)
    .map((x) => x.p);
}

export function getBrandFor(productId: string, meta: ProductMetaMap): string | null {
  return meta.get(productId)?.brand ?? null;
}
