import "server-only";
import { getDb } from "@/lib/db";
import type { FeaturedProduct, CarouselSlide } from "@/lib/db/types";
import { withoutBlockedBlobs } from "@/lib/blob-status";

/** Admin-chosen featured product IDs, in order. Empty = use default logic. */
export async function loadFeaturedProductIds(): Promise<string[]> {
  try {
    const db = await getDb();
    const rows = await db.all<FeaturedProduct>(
      "SELECT product_id FROM featured_products ORDER BY display_order, id",
    );
    return rows.map((r) => r.product_id);
  } catch (e) {
    console.warn("[featured] read failed", e);
    return [];
  }
}

/** Admin-managed carousel slides, in order. Empty = use bundled static slides. */
export async function loadCarouselSlides(): Promise<CarouselSlide[]> {
  try {
    const db = await getDb();
    const rows = await db.all<CarouselSlide>(
      "SELECT * FROM carousel_slides ORDER BY display_order, id",
    );
    // Dropping blocked slides leaves an empty list, which makes HeroCarousel
    // fall back to the bundled DEFAULT_SLIDES.
    return withoutBlockedBlobs(rows, (r) => r.image_url);
  } catch (e) {
    console.warn("[carousel] read failed", e);
    return [];
  }
}
