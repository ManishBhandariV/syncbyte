import "server-only";
import { getDb } from "@/lib/db";
import type { BrandLogo } from "@/lib/db/types";
import { getBrandLogo as getBrandLogoFromFs } from "@/lib/data/brands-server";

export type BrandLogoMap = Map<string, string>;

/**
 * Resolve all brand logos: prefer admin-uploaded URLs (from Blob via DB),
 * falling back to bundled files under /public/images/brands.
 */
export async function loadBrandLogos(): Promise<BrandLogoMap> {
  const map: BrandLogoMap = new Map();
  try {
    const db = await getDb();
    const rows = await db.all<BrandLogo>(
      "SELECT brand_slug, logo_url FROM brand_logos",
    );
    for (const r of rows) map.set(r.brand_slug, r.logo_url);
  } catch (e) {
    console.warn("[brand-logos] DB read failed", e);
  }
  return map;
}

export function resolveBrandLogo(slug: string, db: BrandLogoMap): string | null {
  return db.get(slug) ?? getBrandLogoFromFs(slug);
}
