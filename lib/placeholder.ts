/**
 * Self-contained SVG placeholder (data URI) — usable from client AND server
 * components (no node:fs). via.placeholder.com is dead; anything still
 * pointing at it renders a broken-image icon.
 */
export function svgPlaceholder(
  label: string,
  opts?: { width?: number; height?: number; bg?: string; fg?: string },
): string {
  const w = opts?.width ?? 300;
  const h = opts?.height ?? 200;
  const bg = opts?.bg ?? "#e2e8f0";
  const fg = opts?.fg ?? "#1a365d";
  const safe = label.replace(/[<>&"']/g, "").slice(0, 24);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${bg}"/>` +
    `<text x="${w / 2}" y="${h / 2}" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.max(12, Math.round(h / 12))}" fill="${fg}" text-anchor="middle" dominant-baseline="middle" font-weight="600">${safe}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
