import Link from "next/link";
import { siteConfig } from "@/lib/config";
import {
  productCategories,
  getCategoryUrl,
  getProductUrl,
  totalProductCount,
  type Product,
} from "@/lib/data/products";
import { BRANDS, findBrand } from "@/lib/data/brands";
import {
  loadProductMeta,
  sortByMeta,
  getBrandFor,
  bestProductImage,
} from "@/lib/data/product-meta";

type SP = { brand?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { brand } = await searchParams;
  const b = brand ? findBrand(brand) : undefined;
  return {
    title: b ? `${b.name} Products` : "All Products",
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { brand } = await searchParams;
  const total = totalProductCount();
  const telHref = `tel:${siteConfig.companyPhone.replace(/\s/g, "")}`;
  const meta = await loadProductMeta();
  const selectedBrand = brand ? findBrand(brand) : undefined;

  // For each category, filter+sort the product list once.
  const categoriesView = Object.entries(productCategories).map(
    ([slug, cat]) => {
      const filtered: Product[] = selectedBrand
        ? cat.products.filter((p) => getBrandFor(p.id, meta) === selectedBrand.name)
        : cat.products;
      const sorted = sortByMeta(filtered, meta);
      return { slug, cat, products: sorted };
    },
  );

  // When filtering by brand we want a flat layout (any category that has hits).
  const visibleCategories = categoriesView.filter(
    (c) => !selectedBrand || c.products.length > 0,
  );
  const totalFiltered = categoriesView.reduce((s, c) => s + c.products.length, 0);

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">
            {selectedBrand ? `${selectedBrand.name} Products` : "All Products"}
          </h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            {selectedBrand ? (
              <>
                <Link href="/products">Products</Link>
                <span>/</span>
                <span>{selectedBrand.name}</span>
              </>
            ) : (
              <span>Products</span>
            )}
          </nav>
        </div>
      </section>

      <section className="section products-page">
        <div className="container">
          <div className="products-layout">
            <aside className="products-sidebar">
              <div className="sidebar-widget">
                <h3 className="widget-title">Product Categories</h3>
                <ul className="category-list">
                  <li className={!selectedBrand ? "active" : ""}>
                    <Link href="/products">
                      <i className="fas fa-th-large" />
                      All Products
                      <span className="count">{total}</span>
                    </Link>
                  </li>
                  {Object.entries(productCategories).map(([slug, cat]) => (
                    <li key={slug}>
                      <Link href={getCategoryUrl(slug)}>
                        <i className={`fas ${cat.icon}`} />
                        {cat.name}
                        <span className="count">{cat.products.length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sidebar-widget" style={{ marginTop: 24 }}>
                <h3 className="widget-title">Filter by Brand</h3>
                <ul className="category-list">
                  <li className={!selectedBrand ? "active" : ""}>
                    <Link href="/products">
                      <i className="fas fa-th" /> All Brands
                    </Link>
                  </li>
                  {BRANDS.map((b) => (
                    <li
                      key={b.slug}
                      className={selectedBrand?.slug === b.slug ? "active" : ""}
                    >
                      <Link href={`/products?brand=${encodeURIComponent(b.slug)}`}>
                        <i className="fas fa-tag" /> {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="products-main">
              {selectedBrand && totalFiltered === 0 && (
                <div className="no-results" style={{ marginTop: 0 }}>
                  <i className="fas fa-search" />
                  <h3>No products tagged with {selectedBrand.name} yet</h3>
                  <p>
                    Tag products with this brand from the admin panel to see them here.
                  </p>
                  <Link href="/products" className="btn btn-primary">
                    See all products
                  </Link>
                </div>
              )}

              {visibleCategories.map(({ slug, cat, products }) => {
                if (products.length === 0) return null;
                const showCount = selectedBrand ? products.length : Math.min(4, products.length);
                return (
                  <div className="category-section" id={slug} key={slug}>
                    <div className="category-section-header">
                      <div className="category-title-wrap">
                        <i className={`fas ${cat.icon}`} />
                        <h2>{cat.name}</h2>
                      </div>
                      <Link href={getCategoryUrl(slug)} className="view-all-link">
                        View All <i className="fas fa-arrow-right" />
                      </Link>
                    </div>
                    <p className="category-description">{cat.description}</p>
                    <div className="products-grid products-grid-4">
                      {products.slice(0, showCount).map((product) => (
                        <div className="product-card product-card-compact" key={product.id}>
                          <div className="product-image">
                            <img src={bestProductImage(product.id, meta)} alt={product.name} />
                            <div className="product-overlay">
                              <Link
                                href={getProductUrl(slug, product.id)}
                                className="btn btn-secondary btn-sm"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                          <div className="product-info">
                            <h3 className="product-name">{product.name}</h3>
                            <p className="product-desc">{product.short_desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Need Help Choosing the Right Product?</h2>
            <p>
              Our experts are here to help you find the perfect security
              solution for your needs
            </p>
            <div className="cta-buttons">
              <Link href="/contact" className="btn btn-primary btn-lg">
                Contact Us
              </Link>
              <a href={telHref} className="btn btn-secondary btn-lg">
                <i className="fas fa-phone" /> {siteConfig.companyPhone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
