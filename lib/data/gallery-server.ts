import "server-only";
import { getDb } from "@/lib/db";
import type { GalleryImage, GalleryVideo } from "@/lib/db/types";
import { withoutBlockedBlobs } from "@/lib/blob-status";

export async function loadGalleryImages(): Promise<GalleryImage[]> {
  try {
    const db = await getDb();
    const rows = await db.all<GalleryImage>(
      "SELECT * FROM gallery_images ORDER BY display_order, id DESC",
    );
    // Gallery photos have no bundled fallback — hide them rather than render
    // a grid of broken images.
    return withoutBlockedBlobs(rows, (r) => r.image_url);
  } catch (e) {
    console.warn("[gallery] images DB read failed", e);
    return [];
  }
}

export async function loadGalleryVideos(): Promise<GalleryVideo[]> {
  try {
    const db = await getDb();
    return await db.all<GalleryVideo>(
      "SELECT * FROM gallery_videos ORDER BY display_order, id DESC",
    );
  } catch (e) {
    console.warn("[gallery] videos DB read failed", e);
    return [];
  }
}
