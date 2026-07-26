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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // ?ids=a,b,c → export only those products; otherwise export all.
  const url = new URL(req.url);
  const idsParam = (url.searchParams.get("ids") ?? "").trim();
  const idFilter = idsParam
    ? new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  const meta = await loadProductMeta();
  const db = await getDb();

  // Grouped content for each product: "key: value | ...", "feat | ...", "title = url | ...".
  const specsMap = new Map<string, string[]>();
  const featMap = new Map<string, string[]>();
  const dlMap = new Map<string, string[]>();
  try {
    const specs = await db.all<{ product_id: string; spec_key: string; spec_value: string }>(
      "SELECT product_id, spec_key, spec_value FROM product_specs ORDER BY product_id, display_order",
    );
    for (const s of specs) {
      const list = specsMap.get(s.product_id) ?? [];
      list.push(`${s.spec_key}: ${s.spec_value}`);
      specsMap.set(s.product_id, list);
    }
    const feats = await db.all<{ product_id: string; feature: string }>(
      "SELECT product_id, feature FROM product_features ORDER BY product_id, display_order",
    );
    for (const f of feats) {
      const list = featMap.get(f.product_id) ?? [];
      list.push(f.feature);
      featMap.set(f.product_id, list);
    }
    const dls = await db.all<{ product_id: string; file_title: string; file_url: string }>(
      "SELECT product_id, file_title, file_url FROM product_downloads ORDER BY product_id, display_order",
    );
    for (const d of dls) {
      const list = dlMap.get(d.product_id) ?? [];
      list.push(`${d.file_title} = ${d.file_url}`);
      dlMap.set(d.product_id, list);
    }
  } catch {
    /* ignore — export still works with basic fields */
  }

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

  const selected = idFilter ? rows.filter((r) => idFilter.has(r.id)) : rows;

  const header = [
    "Category",
    "Product ID",
    "Name",
    "Display Name",
    "Brand",
    "Custom",
    "Hidden",
    "Specifications",
    "Features",
    "Downloads",
  ];
  const lines = [header.join(",")];
  for (const r of selected) {
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
        csvCell((specsMap.get(r.id) ?? []).join(" | ")),
        csvCell((featMap.get(r.id) ?? []).join(" | ")),
        csvCell((dlMap.get(r.id) ?? []).join(" | ")),
      ].join(","),
    );
  }
  // BOM so Excel detects UTF-8.
  const csv = "﻿" + lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  const suffix = idFilter ? `-selected-${selected.length}` : "-all";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="syncbyte-products${suffix}-${date}.csv"`,
    },
  });
}
