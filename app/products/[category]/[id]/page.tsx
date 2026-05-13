import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config";
import {
  findProduct,
  getCategoryUrl,
  getProductUrl,
} from "@/lib/data/products";
import { getProductImage } from "@/lib/data/images";
import { loadProductMeta, bestProductImage } from "@/lib/data/product-meta";
import { ProductTabs } from "@/components/ProductTabs";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { getDb } from "@/lib/db";
import type { ProductSpec, ProductDownload } from "@/lib/db/types";

type Params = { category: string; id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, id } = await params;
  const found = findProduct(category, id);
  return { title: found?.product.name ?? "Product" };
}

const DEFAULT_SPECS: Array<[string, string]> = [
  ["Verification Speed", "< 1 second"],
  ["User Capacity", "3,000 users"],
  ["Communication", "TCP/IP, USB"],
  ["Display", "2.8\" TFT LCD"],
  ["Power Supply", "DC 12V/1.5A"],
  ["Operating Temperature", "0°C ~ 45°C"],
  ["Dimensions", "195 x 142 x 44 mm"],
  ["Weight", "500g"],
];

const FEATURES = [
  "High-speed verification algorithm",
  "Multiple verification modes",
  "Anti-passback support",
  "Built-in webserver for easy configuration",
  "Optional WiFi module available",
  "Multi-language support",
  "Access control interface",
  "Wiegand input/output",
];

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: categorySlug, id: productId } = await params;
  const found = findProduct(categorySlug, productId);
  if (!found) notFound();
  const { category, product } = found;

  const cataloguePath = `/product-catalogues/${product.id}.pdf`;
  const shareUrlAbs = `https://syncbyte.example${getProductUrl(categorySlug, product.id)}`;

  const specifications: Array<[string, string]> = [
    ["Model", product.name],
    ["Category", category.name],
    ...DEFAULT_SPECS,
  ];

  const relatedProducts = category.products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const meta = await loadProductMeta();
  const mainImage = bestProductImage(product.id, meta);

  // DB-backed specs/downloads. Tolerate DB unavailability (empty arrays).
  let dbSpecs: ProductSpec[] = [];
  let dbDownloads: ProductDownload[] = [];
  try {
    const db = await getDb();
    dbSpecs = await db.all<ProductSpec>(
      "SELECT * FROM product_specs WHERE product_id = ? ORDER BY display_order",
      [product.id],
    );
    dbDownloads = await db.all<ProductDownload>(
      "SELECT * FROM product_downloads WHERE product_id = ? ORDER BY display_order",
      [product.id],
    );
  } catch (e) {
    console.warn("[product] DB lookup failed, falling back to defaults", e);
  }

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">{product.name}</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/products">Products</Link>
            <span>/</span>
            <Link href={getCategoryUrl(categorySlug)}>{category.name}</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="section product-detail">
        <div className="container">
          <div className="product-detail-grid">
            <ProductImageGallery
              mainImage={mainImage}
              productId={product.id}
              productName={product.name}
            />

            <div className="product-detail-info">
              <span className="product-category-badge">
                <i className={`fas ${category.icon}`} /> {category.name}
              </span>
              <h1 className="product-detail-title">{product.name}</h1>
              <p className="product-detail-desc">{product.short_desc}</p>

              <div className="product-highlights">
                <h3>Key Highlights</h3>
                <ul className="highlights-list">
                  {FEATURES.slice(0, 4).map((f) => (
                    <li key={f}>
                      <i className="fas fa-check-circle" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="product-actions">
                <a href={cataloguePath} className="btn btn-primary btn-lg" download>
                  <i className="fas fa-download" /> Download Catalogue
                </a>
                <Link
                  href={`/contact?product=${encodeURIComponent(product.name)}`}
                  className="btn btn-secondary btn-lg"
                >
                  <i className="fas fa-envelope" /> Enquire Now
                </Link>
              </div>

              <div className="product-share">
                <span>Share:</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrlAbs)}`}
                  target="_blank"
                  rel="noopener"
                  className="share-link"
                >
                  <i className="fab fa-facebook-f" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrlAbs)}&text=${encodeURIComponent(`Check out ${product.name} from ${siteConfig.companyName}`)}`}
                  target="_blank"
                  rel="noopener"
                  className="share-link"
                >
                  <i className="fab fa-x-twitter" />
                </a>
                <a
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrlAbs)}`}
                  target="_blank"
                  rel="noopener"
                  className="share-link"
                >
                  <i className="fab fa-linkedin-in" />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} from ${siteConfig.companyName}: ${shareUrlAbs}`)}`}
                  target="_blank"
                  rel="noopener"
                  className="share-link"
                >
                  <i className="fab fa-whatsapp" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductTabs
        specifications={specifications}
        features={FEATURES}
        cataloguePath={cataloguePath}
        productId={product.id}
      />

      {dbSpecs.length > 0 && (
        <section className="container" style={{ marginTop: 28 }}>
          <div className="product-specs">
            <h3
              style={{
                fontSize: "1rem",
                color: "#1a365d",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "2px solid #e0f2fe",
              }}
            >
              <i className="fas fa-list-ul" style={{ color: "#0ea5e9", marginRight: 8 }} />
              Technical Specifications
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <tbody>
                {dbSpecs.map((spec) => (
                  <tr key={spec.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontWeight: 600,
                        color: "#374151",
                        width: "45%",
                        background: "#f8fafc",
                      }}
                    >
                      {spec.spec_key}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#555" }}>{spec.spec_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {dbDownloads.length > 0 && (
        <section className="container" style={{ marginTop: 24 }}>
          <div className="product-downloads">
            <h3
              style={{
                fontSize: "1rem",
                color: "#1a365d",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "2px solid #e0f2fe",
              }}
            >
              <i className="fas fa-download" style={{ color: "#0ea5e9", marginRight: 8 }} />
              Downloads & Datasheets
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {dbDownloads.map((dl) => {
                const icons: Record<string, string> = {
                  pdf: "fa-file-pdf",
                  doc: "fa-file-word",
                  image: "fa-file-image",
                  other: "fa-file",
                };
                const colors: Record<string, string> = {
                  pdf: "#dc2626",
                  doc: "#1d4ed8",
                  image: "#059669",
                  other: "#6b7280",
                };
                const icon = icons[dl.file_type] ?? "fa-file";
                const color = colors[dl.file_type] ?? "#6b7280";
                return (
                  <a
                    key={dl.id}
                    href={dl.file_url}
                    target="_blank"
                    rel="noopener"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 16px",
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: 8,
                      textDecoration: "none",
                      color: "#0369a1",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    <i className={`fas ${icon}`} style={{ color, fontSize: "1.1rem" }} />
                    {dl.file_title}
                    {dl.file_size && (
                      <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                        ({dl.file_size})
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section related-products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Related Products</h2>
            <p className="section-subtitle">More products from {category.name}</p>
          </div>
          <div className="products-grid products-grid-4">
            {relatedProducts.map((rp) => (
              <div className="product-card product-card-compact" key={rp.id}>
                <div className="product-image">
                  <img src={bestProductImage(rp.id, meta)} alt={rp.name} />
                  <div className="product-overlay">
                    <Link
                      href={getProductUrl(categorySlug, rp.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{rp.name}</h3>
                  <p className="product-desc">{rp.short_desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
