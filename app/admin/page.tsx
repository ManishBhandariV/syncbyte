import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { productCategories } from "@/lib/data/products";
import type {
  ProductSpec,
  ProductDownload,
  ProductMeta,
  ProductFeature,
  CustomProduct,
} from "@/lib/db/types";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminProductSearch } from "@/components/AdminProductSearch";
import { SpecsPanel } from "@/components/SpecsPanel";
import { DownloadsPanel } from "@/components/DownloadsPanel";
import { FeaturesPanel } from "@/components/FeaturesPanel";
import { MetaPanel } from "@/components/MetaPanel";
import { ImagesPanel } from "@/components/ImagesPanel";
import { AdminTopBar } from "@/components/AdminTopBar";
import { ProductDangerPanel } from "@/components/ProductDangerPanel";
import { loadEffectiveBrands } from "@/lib/data/brands-effective";
import { loadProductImages } from "@/lib/data/product-images-server";

export const metadata = { title: "Admin Panel" };
// Admin must always be dynamic (session cookie).
export const dynamic = "force-dynamic";

type SearchParams = { product?: string };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) return <AdminLogin />;

  const db = await getDb();

  // Load custom products grouped by their category slug.
  const customByCat = new Map<string, CustomProduct[]>();
  try {
    const customs = await db.all<CustomProduct>(
      "SELECT product_id, category_slug, name FROM custom_products ORDER BY created_at",
    );
    for (const c of customs) {
      const list = customByCat.get(c.category_slug) ?? [];
      list.push(c);
      customByCat.set(c.category_slug, list);
    }
  } catch (e) {
    console.warn("[admin] could not load custom products", e);
  }

  // Build the sidebar list: for each category, its static products immediately
  // followed by any custom products in that same category, so they group as one.
  const allProducts: Array<{
    id: string;
    name: string;
    category: string;
    isCustom: boolean;
  }> = [];
  for (const [slug, cat] of Object.entries(productCategories)) {
    for (const p of cat.products) {
      allProducts.push({ id: p.id, name: p.name, category: cat.name, isCustom: false });
    }
    for (const c of customByCat.get(slug) ?? []) {
      allProducts.push({ id: c.product_id, name: c.name, category: cat.name, isCustom: true });
    }
  }

  const { product } = await searchParams;
  const selectedId = product ?? allProducts[0]?.id ?? "";
  const selectedProduct = allProducts.find((p) => p.id === selectedId);
  const specs = selectedId
    ? await db.all<ProductSpec>(
        "SELECT * FROM product_specs WHERE product_id = ? ORDER BY display_order",
        [selectedId],
      )
    : [];
  const downloads = selectedId
    ? await db.all<ProductDownload>(
        "SELECT * FROM product_downloads WHERE product_id = ? ORDER BY display_order",
        [selectedId],
      )
    : [];
  const meta = selectedId
    ? await db.get<ProductMeta>(
        "SELECT * FROM product_meta WHERE product_id = ?",
        [selectedId],
      )
    : undefined;
  const brandsList = await loadEffectiveBrands();
  const productImages = selectedId ? await loadProductImages(selectedId) : [];
  const features = selectedId
    ? await db.all<ProductFeature>(
        "SELECT * FROM product_features WHERE product_id = ? ORDER BY display_order",
        [selectedId],
      )
    : [];
  const pendingReviewCount = (
    await db.get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM reviews WHERE status = 'pending'",
    )
  )?.c ?? 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: "#1a365d", color: "#fff", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: 20, background: "#0f2540", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: "1rem", color: "#0ea5e9", marginBottom: 4 }}>
            ⚙️ Syncbyte Admin
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Product Specs &amp; Downloads
          </p>
        </div>
        <div style={{ padding: "0 12px 12px" }}>
          <Link
            href="/admin/products/new"
            style={{
              display: "block",
              textAlign: "center",
              background: "#10b981",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <i className="fas fa-plus" /> Add Product
          </Link>
          <a
            href="/admin/export-products"
            style={{
              display: "block",
              textAlign: "center",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
              marginTop: 8,
            }}
          >
            <i className="fas fa-file-excel" /> Export to Excel
          </a>
        </div>
        <AdminProductSearch products={allProducts} selectedId={selectedId} />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, background: "#f0f4f8", overflowX: "hidden" }}>
        <AdminTopBar
          title={`Managing: ${selectedId || "(none)"}`}
          username={session.username}
          activeTab="products"
          pendingReviewCount={pendingReviewCount}
        />

        <div style={{ padding: 28 }}>
          {selectedId ? (
            <>
              <MetaPanel
                productId={selectedId}
                productName={selectedProduct?.name ?? selectedId}
                brand={meta?.brand ?? null}
                displayOrder={meta?.display_order ?? 0}
                nameOverride={meta?.name_override ?? null}
                brandOptions={brandsList.map((b) => ({ slug: b.slug, name: b.name }))}
              />
              <ImagesPanel productId={selectedId} images={productImages} />
              <SpecsPanel productId={selectedId} specs={specs} />
              <FeaturesPanel productId={selectedId} features={features} />
              <DownloadsPanel productId={selectedId} downloads={downloads} />
              <ProductDangerPanel
                productId={selectedId}
                productName={selectedProduct?.name ?? selectedId}
                isCustom={selectedProduct?.isCustom ?? false}
                isHidden={(meta?.is_hidden ?? 0) === 1}
              />
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
              <p>Select a product from the sidebar to manage its specs and downloads.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
