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

export function placeholderImage(label: string): string {
  return `https://via.placeholder.com/300x200/e2e8f0/1a365d?text=${encodeURIComponent(label)}`;
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
