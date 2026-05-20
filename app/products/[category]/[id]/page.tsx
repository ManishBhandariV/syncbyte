import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config";
import {
  findProductIn,
  getCategoryUrl,
  getProductUrl,
} from "@/lib/data/products";
import { getProductImage } from "@/lib/data/images";
import { loadProductMeta, bestProductImage, displayName } from "@/lib/data/product-meta";
import { loadEffectiveCategories } from "@/lib/data/products-server";
import { ProductTabs } from "@/components/ProductTabs";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { getDb } from "@/lib/db";
import type { ProductSpec, ProductDownload, ProductFeature } from "@/lib/db/types";

type Params = { category: string; id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, id } = await params;
  const meta = await loadProductMeta();
  const effective = await loadEffectiveCategories(meta);
  const found = findProductIn(effective, category, id);
  if (!found) return { title: "Product" };
  return { title: displayName(found.product, meta) };
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
  const meta = await loadProductMeta();
  const effective = await loadEffectiveCategories(meta);
  const found = findProductIn(effective, categorySlug, productId);
  if (!found) notFound();
  const { category, product } = found;

  const mainImage = bestProductImage(product.id, meta);
  const name = displayName(product, meta);

  // Default to the bundled catalogue PDF; overridden below if the admin
  // has uploaded one or more downloads (we'll use whichever they tag as
  // catalogue, falling back to the first download).
  let cataloguePath = `/product-catalogues/${product.id}.pdf`;
  const shareUrlAbs = `https://syncbyte.example${getProductUrl(categorySlug, product.id)}`;

  const relatedProducts = category.products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  // DB-backed specs/downloads/features. Tolerate DB unavailability (empty arrays).
  let dbSpecs: ProductSpec[] = [];
  let dbDownloads: ProductDownload[] = [];
  let dbFeatures: ProductFeature[] = [];
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
    dbFeatures = await db.all<ProductFeature>(
      "SELECT * FROM product_features WHERE product_id = ? ORDER BY display_order",
      [product.id],
    );
  } catch (e) {
    console.warn("[product] DB lookup failed, falling back to defaults", e);
  }

  const features =
    dbFeatures.length > 0 ? dbFeatures.map((f) => f.feature) : FEATURES;

  // Wire the prominent "Download Catalogue" button to whatever the admin has
  // uploaded. Prefer a download whose title contains "catalogue" / "catalog"
  // (or "datasheet" as a sensible fallback), otherwise just take the first.
  if (dbDownloads.length > 0) {
    const cat =
      dbDownloads.find((d) => /catalog|catalogue/i.test(d.file_title)) ??
      dbDownloads.find((d) => /datasheet/i.test(d.file_title)) ??
      dbDownloads[0];
    cataloguePath = cat.file_url;
  }

  // Specifications: admin-managed DB rows take over completely if any exist;
  // otherwise show the canonical default set so the page never looks empty.
  const specifications: Array<[string, string]> =
    dbSpecs.length > 0
      ? dbSpecs.map((s) => [s.spec_key, s.spec_value] as [string, string])
      : [
          ["Model", name],
          ["Category", category.name],
          ...DEFAULT_SPECS,
        ];

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">{name}</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/products">Products</Link>
            <span>/</span>
            <Link href={getCategoryUrl(categorySlug)}>{category.name}</Link>
            <span>/</span>
            <span>{name}</span>
          </nav>
        </div>
      </section>

      <section className="section product-detail">
        <div className="container">
          <div className="product-detail-grid">
            <ProductImageGallery
              mainImage={mainImage}
              productId={product.id}
              productName={name}
            />

            <div className="product-detail-info">
              <span className="product-category-badge">
                <i className={`fas ${category.icon}`} /> {category.name}
              </span>
              <h1 className="product-detail-title">{name}</h1>
              <p className="product-detail-desc">{product.short_desc}</p>

              <div className="product-highlights">
                <h3>Key Highlights</h3>
                <ul className="highlights-list">
                  {features.slice(0, 4).map((f) => (
                    <li key={f}>
                      <i className="fas fa-check-circle" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="product-actions">
                <a
                  href={cataloguePath}
                  className="btn btn-primary btn-lg"
                  target="_blank"
                  rel="noopener"
                  download
                >
                  <i className="fas fa-download" /> Download Catalogue
                </a>
                <Link
                  href={`/contact?product=${encodeURIComponent(name)}`}
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
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrlAbs)}&text=${encodeURIComponent(`Check out ${name} from ${siteConfig.companyName}`)}`}
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
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out ${name} from ${siteConfig.companyName}: ${shareUrlAbs}`)}`}
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
        features={features}
        downloads={dbDownloads.length > 0 ? dbDownloads : undefined}
        cataloguePath={cataloguePath}
        productId={product.id}
      />

      <section className="section related-products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Related Products</h2>
            <p className="section-subtitle">More products from {category.name}</p>
          </div>
          <div className="products-grid products-grid-4">
            {relatedProducts.map((rp) => {
              const rpName = displayName(rp, meta);
              return (
              <div className="product-card product-card-compact" key={rp.id}>
                <div className="product-image">
                  <img src={bestProductImage(rp.id, meta)} alt={rpName} />
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
                  <h3 className="product-name">{rpName}</h3>
                  <p className="product-desc">{rp.short_desc}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
