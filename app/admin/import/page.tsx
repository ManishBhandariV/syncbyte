import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { productCategories } from "@/lib/data/products";
import type { CustomProduct } from "@/lib/db/types";
import { AdminTopBar } from "@/components/AdminTopBar";
import { ImportClient } from "@/components/ImportClient";
import { ExportProductsClient } from "@/components/ExportProductsClient";

export const metadata = { title: "Admin · Import / Export Products" };
export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  // Product list (static + custom) for the export selector.
  const products: Array<{ id: string; name: string; category: string }> = [];
  for (const [, cat] of Object.entries(productCategories)) {
    for (const p of cat.products) products.push({ id: p.id, name: p.name, category: cat.name });
  }
  try {
    const db = await getDb();
    const customs = await db.all<CustomProduct>(
      "SELECT product_id, category_slug, name FROM custom_products ORDER BY created_at",
    );
    for (const c of customs) {
      const cat = productCategories[c.category_slug];
      products.push({ id: c.product_id, name: c.name, category: cat ? cat.name : c.category_slug });
    }
  } catch {
    /* ignore */
  }

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Import / Export" username={session.username} activeTab="products" />
      <div style={{ padding: 28, maxWidth: 760, margin: "0 auto" }}>
        <ExportProductsClient products={products} />
        <ImportClient />
      </div>
    </div>
  );
}
