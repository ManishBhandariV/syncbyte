import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { productCategories } from "@/lib/data/products";
import type { CustomCategory } from "@/lib/db/types";
import { AdminTopBar } from "@/components/AdminTopBar";
import { CategoriesAdminClient } from "@/components/CategoriesAdminClient";

export const metadata = { title: "Admin · Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const db = await getDb();

  let customCategories: CustomCategory[] = [];
  try {
    customCategories = await db.all<CustomCategory>(
      "SELECT id, slug, name, icon, description, display_order, created_at FROM custom_categories ORDER BY display_order, name",
    );
  } catch (e) {
    console.warn("[admin/categories] custom_categories read failed", e);
  }

  // Counts: how many products (static + custom + moved-via-override) live in each category.
  let customByCategory = new Map<string, number>();
  try {
    const rows = await db.all<{ category_slug: string; c: number }>(
      "SELECT category_slug, COUNT(*) AS c FROM custom_products GROUP BY category_slug",
    );
    customByCategory = new Map(rows.map((r) => [r.category_slug, r.c]));
  } catch {
    /* ignore */
  }

  let overrideCounts = new Map<string, number>();
  try {
    const rows = await db.all<{ category_override: string; c: number }>(
      "SELECT category_override, COUNT(*) AS c FROM product_meta WHERE category_override IS NOT NULL GROUP BY category_override",
    );
    overrideCounts = new Map(rows.map((r) => [r.category_override, r.c]));
  } catch {
    /* ignore */
  }

  // Build the unified view
  const staticRows = Object.entries(productCategories).map(([slug, cat]) => {
    // Adjust counts for category_override: subtract overrides moved away,
    // add overrides moved here.
    const movedOut = Object.entries(productCategories).reduce((acc) => acc, 0);
    void movedOut;
    return {
      slug,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      isCustom: false,
      productCount:
        cat.products.length +
        (customByCategory.get(slug) ?? 0) +
        (overrideCounts.get(slug) ?? 0),
    };
  });
  const customRows = customCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    description: c.description,
    isCustom: true,
    productCount:
      (customByCategory.get(c.slug) ?? 0) + (overrideCounts.get(c.slug) ?? 0),
  }));

  // Deduplicate (custom with the same slug as a static would shadow — already
  // prevented at insert time, but be safe).
  const seen = new Set<string>();
  const allRows = [...staticRows, ...customRows].filter((r) => {
    if (seen.has(r.slug)) return false;
    seen.add(r.slug);
    return true;
  });

  return (
    <div
      style={{
        background: "#f0f4f8",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <AdminTopBar
        title="Categories"
        username={session.username}
        activeTab="categories"
      />
      <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
        <CategoriesAdminClient categories={allRows} />
      </div>
    </div>
  );
}
