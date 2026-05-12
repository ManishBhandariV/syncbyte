import Link from "next/link";
import { siteConfig } from "@/lib/config";
import {
  productCategories,
  getCategoryUrl,
  getProductUrl,
  totalProductCount,
} from "@/lib/data/products";
import { getProductImage } from "@/lib/data/images";

export const metadata = { title: "All Products" };

export default function ProductsPage() {
  const total = totalProductCount();
  const telHref = `tel:${siteConfig.companyPhone.replace(/\s/g, "")}`;

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">All Products</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Products</span>
          </nav>
        </div>
      </section>

      <section className="section products-page">
        <div className="container">
          <div className="products-layout">
            {/* Sidebar */}
            <aside className="products-sidebar">
              <div className="sidebar-widget">
                <h3 className="widget-title">Product Categories</h3>
                <ul className="category-list">
                  <li className="active">
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
            </aside>

            {/* Main: all categories grouped */}
            <div className="products-main">
              {Object.entries(productCategories).map(([slug, category]) => (
                <div className="category-section" id={slug} key={slug}>
                  <div className="category-section-header">
                    <div className="category-title-wrap">
                      <i className={`fas ${category.icon}`} />
                      <h2>{category.name}</h2>
                    </div>
                    <Link href={getCategoryUrl(slug)} className="view-all-link">
                      View All <i className="fas fa-arrow-right" />
                    </Link>
                  </div>
                  <p className="category-description">{category.description}</p>
                  <div className="products-grid products-grid-4">
                    {category.products.slice(0, 4).map((product) => (
                      <div className="product-card product-card-compact" key={product.id}>
                        <div className="product-image">
                          <img src={getProductImage(product.id)} alt={product.name} />
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
              ))}
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
