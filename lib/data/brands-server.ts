import "server-only";
import fs from "node:fs";
import path from "node:path";

const BRAND_LOGOS_DIR = path.join(process.cwd(), "public", "images", "brands");
const LOGO_EXTS = ["webp", "png", "jpg", "svg", "PNG"] as const;
const logoCache = new Map<string, string | null>();

/**
 * Returns the URL for a brand's logo if one has been uploaded under
 * /public/images/brands, otherwise null (caller shows a text fallback).
 * Server-only because it reads the filesystem.
 */
export function getBrandLogo(slug: string): string | null {
  if (logoCache.has(slug)) return logoCache.get(slug)!;
  for (const ext of LOGO_EXTS) {
    const file = `${slug}.${ext}`;
    try {
      if (fs.existsSync(path.join(BRAND_LOGOS_DIR, file))) {
        const url = `/images/brands/${encodeURI(file)}`;
        logoCache.set(slug, url);
        return url;
      }
    } catch {
      // readonly fs may throw — fall through to "no logo"
    }
  }
  logoCache.set(slug, null);
  return null;
}
