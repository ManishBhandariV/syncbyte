import "server-only";
import { getDb } from "@/lib/db";
import { productCategories, type Product, type ProductCategory } from "@/lib/data/products";
import type { CustomProduct } from "@/lib/db/types";
import type { ProductMetaMap } from "@/lib/data/product-meta";

/**
 * Loads admin-added custom products and merges them into the static category map.
 * Also applies `is_hidden` filter from product_meta.
 * Returns the same shape as productCategories so existing callers don't change.
 */
export async function loadEffectiveCategories(
  meta: ProductMetaMap,
): Promise<Record<string, ProductCategory>> {
  const customByCategory = new Map<string, Product[]>();
  try {
    const db = await getDb();
    const rows = await db.all<CustomProduct>(
      "SELECT product_id, category_slug, name, short_desc FROM custom_products ORDER BY created_at",
    );
    for (const r of rows) {
      const p: Product = {
        id: r.product_id,
        name: r.name,
        short_desc: r.short_desc ?? r.name,
      };
      const list = customByCategory.get(r.category_slug) ?? [];
      list.push(p);
      customByCategory.set(r.category_slug, list);
    }
  } catch (e) {
    console.warn("[products] custom_products read failed", e);
  }

  const result: Record<string, ProductCategory> = {};
  for (const [slug, cat] of Object.entries(productCategories)) {
    const custom = customByCategory.get(slug) ?? [];
    const merged = [...cat.products, ...custom].filter(
      (p) => !isHidden(p.id, meta),
    );
    result[slug] = { ...cat, products: merged };
  }
  // Custom products in a category that doesn't exist in static are dropped
  // (would require category CRUD too — deferred).
  return result;
}

function isHidden(productId: string, meta: ProductMetaMap): boolean {
  const m = meta.get(productId);
  return !!m && (m as unknown as { is_hidden?: number }).is_hidden === 1;
}
