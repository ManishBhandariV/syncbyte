import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { productCategories } from "@/lib/data/products";
import type { ProductSpec, ProductDownload } from "@/lib/db/types";
import { logout } from "./actions";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminProductSearch } from "@/components/AdminProductSearch";
import { SpecsPanel } from "@/components/SpecsPanel";
import { DownloadsPanel } from "@/components/DownloadsPanel";

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

  const allProducts: Array<{ id: string; name: string; category: string }> = [];
  for (const cat of Object.values(productCategories)) {
    for (const p of cat.products) {
      allProducts.push({ id: p.id, name: p.name, category: cat.name });
    }
  }

  const { product } = await searchParams;
  const selectedId = product ?? allProducts[0]?.id ?? "";

  const db = await getDb();
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
        <AdminProductSearch products={allProducts} selectedId={selectedId} />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, background: "#f0f4f8", overflowX: "hidden" }}>
        <div
          style={{
            background: "#fff",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <h1 style={{ fontSize: "1.1rem", color: "#1a365d" }}>
            Managing: <strong>{selectedId || "(none)"}</strong>
          </h1>
          <div>
            <span style={{ color: "#94a3b8", fontSize: "0.82rem", marginRight: 16 }}>
              Logged in as <strong>{session.username}</strong>
            </span>
            <form action={logout} style={{ display: "inline" }}>
              <button
                type="submit"
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                <i className="fas fa-sign-out-alt" /> Logout
              </button>
            </form>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {selectedId ? (
            <>
              <SpecsPanel productId={selectedId} specs={specs} />
              <DownloadsPanel productId={selectedId} downloads={downloads} />
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
