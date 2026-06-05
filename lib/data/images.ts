import fs from "node:fs";
import path from "node:path";

const PRODUCTS_DIR = path.join(process.cwd(), "public", "images", "products");
const EXTS = ["webp", "png", "jpg", "PNG", "jpeg"] as const;

const cache = new Map<string, string | null>();

export function getProductImage(productId: string): string {
  if (cache.has(productId)) {
    return cache.get(productId) ?? placeholderImage(productId);
  }
  for (const ext of EXTS) {
    const file = `${productId}.${ext}`;
    try {
      if (fs.existsSync(path.join(PRODUCTS_DIR, file))) {
        const url = `/images/products/${encodeURI(file)}`;
        cache.set(productId, url);
        return url;
      }
    } catch {
      // ignore — readonly fs on Vercel may throw on some paths
    }
  }
  cache.set(productId, null);
  return placeholderImage(productId);
}

/**
 * Self-contained SVG placeholder (data URI) — no external service.
 * via.placeholder.com is dead, which used to leave a broken-image icon.
 */
export function placeholderImage(label: string): string {
  const safe = label.replace(/[<>&"']/g, "").slice(0, 24);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">` +
    `<rect width="300" height="200" fill="#e2e8f0"/>` +
    `<text x="150" y="95" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#1a365d" text-anchor="middle" font-weight="600">${safe}</text>` +
    `<text x="150" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">image coming soon</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getCustomerLogos(): string[] {
  const dir = path.join(process.cwd(), "public", "images", "customers");
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|gif|webp)$/i.test(f))
      .map((f) => `/images/customers/${encodeURI(f)}`);
  } catch {
    return [];
  }
}
