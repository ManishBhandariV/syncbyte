import "server-only";
import { getDb } from "@/lib/db";
import type { ProductImage } from "@/lib/db/types";

export type ProductImagesMap = Map<string, string[]>;

/** All admin-uploaded product images keyed by product_id, ordered. */
export async function loadProductImagesMap(): Promise<ProductImagesMap> {
  const map: ProductImagesMap = new Map();
  try {
    const db = await getDb();
    const rows = await db.all<ProductImage>(
      "SELECT product_id, image_url FROM product_images ORDER BY product_id, display_order, id",
    );
    for (const r of rows) {
      const list = map.get(r.product_id) ?? [];
      list.push(r.image_url);
      map.set(r.product_id, list);
    }
  } catch (e) {
    console.warn("[product-images] read failed", e);
  }
  return map;
}

/** Images for a single product (admin page / detail page). */
export async function loadProductImages(productId: string): Promise<ProductImage[]> {
  try {
    const db = await getDb();
    return await db.all<ProductImage>(
      "SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order, id",
      [productId],
    );
  } catch (e) {
    console.warn("[product-images] single read failed", e);
    return [];
  }
}
