import "server-only";
import { getDb } from "@/lib/db";
import { productCategories, type Product, type ProductCategory } from "@/lib/data/products";
import type { CustomCategory, CustomProduct } from "@/lib/db/types";
import type { ProductMetaMap } from "@/lib/data/product-meta";

/**
 * Loads admin-added custom categories + custom products and merges them with
 * the static category map. Applies `is_hidden` filter and `category_override`
 * (moves a static product to a different category).
 * Returns the same shape as productCategories so existing callers don't change.
 */
export async function loadEffectiveCategories(
  meta: ProductMetaMap,
): Promise<Record<string, ProductCategory>> {
  const customByCategory = new Map<string, Product[]>();
  const customCategories: CustomCategory[] = [];
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
    const catRows = await db.all<CustomCategory>(
      "SELECT id, slug, name, icon, description, display_order FROM custom_categories ORDER BY display_order, name",
    );
    customCategories.push(...catRows);
  } catch (e) {
    console.warn("[products] custom_* read failed", e);
  }

  // Build the working catalog: clone static categories + add any custom ones
  // that don't shadow a static slug.
  const working: Record<string, ProductCategory> = {};
  for (const [slug, cat] of Object.entries(productCategories)) {
    working[slug] = { ...cat, products: [...cat.products] };
  }
  for (const cc of customCategories) {
    if (!working[cc.slug]) {
      working[cc.slug] = {
        name: cc.name,
        icon: cc.icon || "fa-folder",
        description: cc.description || "",
        products: [],
      };
    }
  }

  // Apply category_override: pull static products out of their home category
  // and drop them into the override category (only if it exists).
  for (const [slug, cat] of Object.entries(working)) {
    const remaining: Product[] = [];
    for (const p of cat.products) {
      const override = meta.get(p.id)?.category_override;
      if (override && override !== slug && working[override]) {
        working[override].products.push(p);
      } else {
        remaining.push(p);
      }
    }
    cat.products = remaining;
  }

  // Merge custom_products into their (possibly custom) category, then filter hidden.
  for (const [slug, cat] of Object.entries(working)) {
    const customs = customByCategory.get(slug) ?? [];
    const merged = [...cat.products, ...customs].filter((p) => !isHidden(p.id, meta));
    cat.products = merged;
  }

  return working;
}

function isHidden(productId: string, meta: ProductMetaMap): boolean {
  const m = meta.get(productId);
  return !!m && (m as unknown as { is_hidden?: number }).is_hidden === 1;
}

/**
 * Returns all categories (static + custom) as a flat list — useful for admin
 * UI that needs the full picture.
 */
export async function loadAllCategoriesMeta(): Promise<
  Array<{ slug: string; name: string; isCustom: boolean }>
> {
  const list: Array<{ slug: string; name: string; isCustom: boolean }> = [];
  for (const [slug, cat] of Object.entries(productCategories)) {
    list.push({ slug, name: cat.name, isCustom: false });
  }
  try {
    const db = await getDb();
    const rows = await db.all<CustomCategory>(
      "SELECT slug, name FROM custom_categories ORDER BY display_order, name",
    );
    for (const r of rows) {
      if (!list.some((x) => x.slug === r.slug)) {
        list.push({ slug: r.slug, name: r.name, isCustom: true });
      }
    }
  } catch (e) {
    console.warn("[products] custom_categories read failed", e);
  }
  return list;
}
