import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { productCategories } from "@/lib/data/products";
import { loadProductMeta, displayName } from "@/lib/data/product-meta";
import type { CustomProduct } from "@/lib/db/types";

export const dynamic = "force-dynamic";

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const meta = await loadProductMeta();
  const db = await getDb();

  // Count helpers via grouped queries.
  const countMap = async (table: string) => {
    const rows = await db.all<{ product_id: string; c: number }>(
      `SELECT product_id, COUNT(*) AS c FROM ${table} GROUP BY product_id`,
    );
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.product_id, r.c);
    return m;
  };
  const specCounts = await countMap("product_specs");
  const downloadCounts = await countMap("product_downloads");
  const featureCounts = await countMap("product_features");
  const imageCounts = await countMap("product_images");

  type Row = { id: string; name: string; category: string; isCustom: boolean };
  const rows: Row[] = [];
  for (const [, cat] of Object.entries(productCategories)) {
    for (const p of cat.products) {
      rows.push({ id: p.id, name: p.name, category: cat.name, isCustom: false });
    }
  }
  try {
    const customs = await db.all<CustomProduct>(
      "SELECT product_id, category_slug, name FROM custom_products ORDER BY created_at",
    );
    for (const c of customs) {
      const cat = productCategories[c.category_slug];
      rows.push({ id: c.product_id, name: c.name, category: cat ? cat.name : c.category_slug, isCustom: true });
    }
  } catch {
    /* ignore */
  }

  const header = [
    "Category",
    "Product ID",
    "Name",
    "Display Name",
    "Brand",
    "Custom",
    "Hidden",
    "Specs",
    "Downloads",
    "Features",
    "Images",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const m = meta.get(r.id);
    lines.push(
      [
        csvCell(r.category),
        csvCell(r.id),
        csvCell(r.name),
        csvCell(displayName({ id: r.id, name: r.name }, meta)),
        csvCell(m?.brand ?? ""),
        csvCell(r.isCustom ? "yes" : "no"),
        csvCell(m?.is_hidden === 1 ? "yes" : "no"),
        csvCell(specCounts.get(r.id) ?? 0),
        csvCell(downloadCounts.get(r.id) ?? 0),
        csvCell(featureCounts.get(r.id) ?? 0),
        csvCell(imageCounts.get(r.id) ?? 0),
      ].join(","),
    );
  }
  // BOM so Excel detects UTF-8.
  const csv = "﻿" + lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="syncbyte-products-${date}.csv"`,
    },
  });
}
