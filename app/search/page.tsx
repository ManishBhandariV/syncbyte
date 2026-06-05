import Link from "next/link";
import { productCategories, getCategoryUrl } from "@/lib/data/products";
import { search } from "@/lib/data/search";
import { loadProductMeta, bestProductImage } from "@/lib/data/product-meta";
import { loadProductImagesMap } from "@/lib/data/product-images-server";

export const metadata = { title: "Search Results" };

const POPULAR = [
  "fingerprint",
  "face",
  "boom-barrier",
  "turnstiles",
  "access-control",
  "software-solutions",
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const performed = query.length > 0;
  const results = performed ? search(query) : [];
  const meta = await loadProductMeta();
  const imagesMap = await loadProductImagesMap();

  const categoryResults = results.filter((r) => r.type === "category");
  const productResults = results.filter((r) => r.type === "product");

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">Search Results</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Search</span>
          </nav>
        </div>
      </section>

      <section className="section search-section">
        <div className="container">
          <div className="search-page-form">
            <form action="/search" method="GET" className="search-form">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search products, categories..."
                className="search-input"
                autoFocus
              />
              <button type="submit" className="search-btn">
                <i className="fas fa-search" />
              </button>
            </form>
          </div>

          {performed ? (
            <>
              <div className="search-info">
                <h2>
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </h2>
                <p>Showing results for &quot;{query}&quot;</p>
              </div>

              {results.length > 0 ? (
                <>
                  {categoryResults.length > 0 && (
                    <div className="search-results-section">
                      <h3 className="results-section-title">
                        <i className="fas fa-folder" /> Categories
                      </h3>
                      <div className="categories-grid" style={{ marginBottom: 40 }}>
                        {categoryResults.map((r) => (
                          <Link key={r.url} href={r.url} className="category-card">
                            <div className="category-icon">
                              <i className={`fas ${r.icon}`} />
                            </div>
                            <h3 className="category-name">{r.name}</h3>
                            <span className="category-count">
                              {r.product_count} Products
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {productResults.length > 0 && (
                    <div className="search-results-section">
                      <h3 className="results-section-title">
                        <i className="fas fa-box" /> Products
                      </h3>
                      <div className="products-grid">
                        {productResults.map((r) => (
                          <div className="product-card" key={r.url}>
                            <div className="product-image">
                              <img
                                src={bestProductImage(
                                  r.type === "product" ? r.id : "",
                                  meta,
                                  imagesMap,
                                )}
                                alt={r.name}
                              />
                              <div className="product-overlay">
                                <Link href={r.url} className="btn btn-secondary">
                                  View Details
                                </Link>
                              </div>
                            </div>
                            <div className="product-info">
                              <span className="product-category">{r.category}</span>
                              <h3 className="product-name">{r.name}</h3>
                              <p className="product-desc">{r.description}</p>
                              <Link href={r.url} className="product-link">
                                Learn More <i className="fas fa-arrow-right" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-results">
                  <i className="fas fa-search" />
                  <h3>No results found</h3>
                  <p>
                    We couldn&apos;t find any products matching &quot;{query}
                    &quot;. Try different keywords or browse our categories.
                  </p>
                  <Link href="/products" className="btn btn-primary">
                    Browse All Products
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="no-results">
                <i className="fas fa-search" />
                <h3>Search Our Products</h3>
                <p>
                  Enter a product name, category, or keyword to find what
                  you&apos;re looking for.
                </p>
              </div>
              <div className="section-header" style={{ marginTop: 50 }}>
                <h2 className="section-title">Popular Categories</h2>
                <p className="section-subtitle">
                  Browse our most popular product categories
                </p>
              </div>
              <div className="categories-grid">
                {POPULAR.map((slug) => {
                  const cat = productCategories[slug];
                  if (!cat) return null;
                  return (
                    <Link key={slug} href={getCategoryUrl(slug)} className="category-card">
                      <div className="category-icon">
                        <i className={`fas ${cat.icon}`} />
                      </div>
                      <h3 className="category-name">{cat.name}</h3>
                      <span className="category-count">{cat.products.length} Products</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
