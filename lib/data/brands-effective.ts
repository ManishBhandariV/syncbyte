import "server-only";
import { getDb } from "@/lib/db";
import { BRANDS, type Brand } from "@/lib/data/brands";
import type { CustomBrand } from "@/lib/db/types";

/**
 * Returns the brand list shown on the public site and to the admin:
 * the bundled brands (in their defined order) followed by any admin-added
 * custom brands.
 */
export async function loadEffectiveBrands(): Promise<
  Array<Brand & { isCustom: boolean }>
> {
  const out = BRANDS.map((b) => ({ ...b, isCustom: false }));
  try {
    const db = await getDb();
    const rows = await db.all<CustomBrand>(
      "SELECT slug, name FROM custom_brands ORDER BY created_at",
    );
    for (const r of rows) {
      out.push({ slug: r.slug, name: r.name, isCustom: true });
    }
  } catch (e) {
    console.warn("[brands-effective] custom_brands read failed", e);
  }
  return out;
}
