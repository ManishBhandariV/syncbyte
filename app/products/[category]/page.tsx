import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config";
import {
  productCategories,
  getCategoryUrl,
  getProductUrl,
} from "@/lib/data/products";
import {
  loadProductMeta,
  sortByMeta,
  bestProductImage,
  displayName,
} from "@/lib/data/product-meta";
import { loadEffectiveCategories } from "@/lib/data/products-server";
import { loadProductImagesMap } from "@/lib/data/product-images-server";

type Params = { category: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const cat = productCategories[category];
  return { title: cat ? `${cat.name} Products` : "Products" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: slug } = await params;
  const meta = await loadProductMeta();
  const effective = await loadEffectiveCategories(meta);
  const category = effective[slug];
  if (!category) notFound();
  const imagesMap = await loadProductImagesMap();

  const telHref = `tel:${siteConfig.companyPhone.replace(/\s/g, "")}`;
  const total = Object.values(effective).reduce(
    (s, c) => s + c.products.length,
    0,
  );
  const sortedProducts = sortByMeta(category.products, meta);

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">{category.name} Products</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/products">Products</Link>
            <span>/</span>
            <span>{category.name}</span>
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
                  <li>
                    <Link href="/products">
                      <i className="fas fa-th-large" />
                      All Products
                      <span className="count">{total}</span>
                    </Link>
                  </li>
                  {Object.entries(productCategories).map(([s, cat]) => (
                    <li key={s} className={s === slug ? "active" : ""}>
                      <Link href={getCategoryUrl(s)}>
                        <i className={`fas ${cat.icon}`} />
                        {cat.name}
                        <span className="count">{cat.products.length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="products-main">
              <div className="category-header">
                <div className="category-icon-large">
                  <i className={`fas ${category.icon}`} />
                </div>
                <div className="category-info">
                  <h2>{category.name}</h2>
                  <p>{category.description}</p>
                </div>
              </div>
              <div className="products-grid">
                {sortedProducts.map((product) => {
                  const name = displayName(product, meta);
                  return (
                  <div className="product-card" key={product.id}>
                    <div className="product-image">
                      <img src={bestProductImage(product.id, meta, imagesMap)} alt={name} />
                      <div className="product-overlay">
                        <Link
                          href={getProductUrl(slug, product.id)}
                          className="btn btn-secondary"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                    <div className="product-info">
                      <span className="product-category">{category.name}</span>
                      <h3 className="product-name">{name}</h3>
                      <p className="product-desc">{product.short_desc}</p>
                      <Link
                        href={getProductUrl(slug, product.id)}
                        className="product-link"
                      >
                        Learn More <i className="fas fa-arrow-right" />
                      </Link>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Need Help Choosing the Right Product?</h2>
            <p>Our experts are here to help you find the perfect security solution</p>
            <div className="cta-buttons">
              <Link href="/contact" className="btn btn-primary btn-lg">Contact Us</Link>
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
