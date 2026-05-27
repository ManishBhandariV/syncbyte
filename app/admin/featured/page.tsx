import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { productCategories } from "@/lib/data/products";
import { loadEffectiveCategories } from "@/lib/data/products-server";
import { loadProductMeta, displayName } from "@/lib/data/product-meta";
import type { FeaturedProduct } from "@/lib/db/types";
import { AdminTopBar } from "@/components/AdminTopBar";
import { FeaturedAdminClient } from "@/components/FeaturedAdminClient";

export const metadata = { title: "Admin · Featured" };
export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const meta = await loadProductMeta();
  const effective = await loadEffectiveCategories(meta);

  // Flat list of every product for the picker.
  const allProducts: Array<{ id: string; label: string }> = [];
  for (const [, cat] of Object.entries(effective)) {
    for (const p of cat.products) {
      allProducts.push({ id: p.id, label: `${displayName(p, meta)} — ${cat.name}` });
    }
  }

  const db = await getDb();
  const rows = await db.all<FeaturedProduct>(
    "SELECT * FROM featured_products ORDER BY display_order, id",
  );
  const labelFor = (id: string) =>
    allProducts.find((p) => p.id === id)?.label ?? id;
  const featured = rows.map((r) => ({
    product_id: r.product_id,
    display_order: r.display_order,
    label: labelFor(r.product_id),
  }));

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Featured Products" username={session.username} activeTab="featured" />
      <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
        <FeaturedAdminClient allProducts={allProducts} featured={featured} />
      </div>
    </div>
  );
}
