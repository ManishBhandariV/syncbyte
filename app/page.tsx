import Link from "next/link";
import { HeroCarousel } from "@/components/HeroCarousel";
import { BrandsSection } from "@/components/BrandsSection";
import { CustomersCarousel } from "@/components/CustomersCarousel";
import { siteConfig } from "@/lib/config";
import {
  productCategories,
  getCategoryUrl,
  getProductUrl,
} from "@/lib/data/products";
import { getCustomerLogos } from "@/lib/data/images";
import { loadProductMeta, sortByMeta, bestProductImage, displayName } from "@/lib/data/product-meta";
import { loadApprovedReviews } from "@/lib/data/reviews-server";
import { getGoogleReviews } from "@/lib/data/google-reviews";
import { loadEffectiveCategories } from "@/lib/data/products-server";
import { loadProductImagesMap } from "@/lib/data/product-images-server";
import { loadFeaturedProductIds, loadCarouselSlides } from "@/lib/data/home-server";

// Default featured set when the admin hasn't chosen any: first product of each.
const DEFAULT_FEATURED_CATEGORIES = [
  "fingerprint",
  "face",
  "boom-barrier",
  "turnstiles",
  "access-control",
  "fingerprint-door-lock",
  "metal-detectors",
  "software-solutions",
];

export default async function HomePage() {
  const meta = await loadProductMeta();
  const imagesMap = await loadProductImagesMap();
  const effective = await loadEffectiveCategories(meta);
  const customerLogos = getCustomerLogos();
  const reviews = await loadApprovedReviews(6);
  // Only show Google review cards when a real Places API key is configured.
  const { reviews: googleReviews, isReal: googleIsReal } = await getGoogleReviews();
  const logosToShow = customerLogos;

  // Featured products: admin-chosen if any, else first product of each default category.
  const featuredIds = await loadFeaturedProductIds();
  const featuredItems: Array<{ categorySlug: string; id: string; name: string; categoryName: string; short_desc: string }> = [];
  if (featuredIds.length > 0) {
    for (const fid of featuredIds) {
      for (const [slug, cat] of Object.entries(effective)) {
        const p = cat.products.find((x) => x.id === fid);
        if (p) {
          featuredItems.push({
            categorySlug: slug,
            id: p.id,
            name: displayName(p, meta),
            categoryName: cat.name,
            short_desc: p.short_desc,
          });
          break;
        }
      }
    }
  } else {
    for (const catSlug of DEFAULT_FEATURED_CATEGORIES) {
      const category = effective[catSlug];
      if (!category) continue;
      const ordered = sortByMeta(category.products, meta);
      const p = ordered[0];
      if (!p) continue;
      featuredItems.push({
        categorySlug: catSlug,
        id: p.id,
        name: displayName(p, meta),
        categoryName: category.name,
        short_desc: p.short_desc,
      });
    }
  }

  // Carousel slides from admin (fallback to bundled defaults inside the component).
  const dbSlides = await loadCarouselSlides();
  const carouselSlides = dbSlides.map((s) => ({
    src: s.image_url,
    alt: s.button_label,
    fallbackText: encodeURIComponent(s.button_label),
    href: s.category_slug ? getCategoryUrl(s.category_slug) : "/products",
    ctaLabel: s.button_label,
  }));

  const telHref = `tel:${siteConfig.companyPhone.replace(/\s/g, "")}`;

  return (
    <>
      <HeroCarousel slides={carouselSlides.length > 0 ? carouselSlides : undefined} />

      <BrandsSection />

      {/* Featured Products */}
      <section className="section featured-products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">
              Discover our most popular security and access control solutions
            </p>
          </div>
          <div className="products-grid">
            {featuredItems.map((item) => (
              <div className="product-card" key={item.id}>
                <div className="product-image">
                  <img src={bestProductImage(item.id, meta, imagesMap)} alt={item.name} />
                  <div className="product-overlay">
                    <Link
                      href={getProductUrl(item.categorySlug, item.id)}
                      className="btn btn-secondary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <div className="product-info">
                  <span className="product-category">{item.categoryName}</span>
                  <h3 className="product-name">{item.name}</h3>
                  <p className="product-desc">{item.short_desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link href="/products" className="btn btn-primary btn-lg">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section categories-section bg-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Product Categories</h2>
            <p className="section-subtitle">
              Browse our wide range of security solutions
            </p>
          </div>
          <div className="categories-grid">
            {Object.entries(productCategories).map(([slug, category]) => (
              <Link key={slug} href={getCategoryUrl(slug)} className="category-card">
                <div className="category-icon">
                  <i className={`fas ${category.icon}`} />
                </div>
                <h3 className="category-name">{category.name}</h3>
                <span className="category-count">{category.products.length} Products</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews — only real, admin-approved reviews. Hidden if none yet. */}
      {reviews.length > 0 && (
        <section className="section reviews-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">What Our Customers Say</h2>
              <p className="section-subtitle">Trusted by businesses across India</p>
            </div>
            <div className="reviews-grid">
              {reviews.map((r, i) => (
                <div className="review-card" key={i}>
                  <div className="review-rating">
                    {Array.from({ length: 5 }).map((_, n) => (
                      <i
                        key={n}
                        className={`fas fa-star ${n < r.rating ? "filled" : "empty"}`}
                      />
                    ))}
                  </div>
                  <p className="review-text">&quot;{r.review}&quot;</p>
                  <div className="review-author">
                    <div className="author-avatar">
                      <i className="fas fa-user" />
                    </div>
                    <div className="author-info">
                      <h4 className="author-name">{r.name}</h4>
                      {(r.designation || r.company) && (
                        <p className="author-title">
                          {[r.designation, r.company].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="section-cta">
              <Link href="/reviews" className="btn btn-outline">
                View All Reviews
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Customer Logos */}
      <section className="section customers-section bg-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Trusted Clients</h2>
            <p className="section-subtitle">Proudly serving leading organizations</p>
          </div>
          <CustomersCarousel logos={logosToShow} />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section why-choose-us">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Syncbyte?</h2>
            <p className="section-subtitle">Your trusted partner in security solutions</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-award" /></div>
              <h3 className="feature-title">Quality Products</h3>
              <p className="feature-desc">
                We offer only the highest quality security products from trusted manufacturers
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-headset" /></div>
              <h3 className="feature-title">Expert Support</h3>
              <p className="feature-desc">
                Our technical team provides comprehensive installation and after-sales support
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-truck-fast" /></div>
              <h3 className="feature-title">Pan-India Service</h3>
              <p className="feature-desc">
                We deliver and service across all major cities in India
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-shield" /></div>
              <h3 className="feature-title">Warranty Assured</h3>
              <p className="feature-desc">
                All our products come with manufacturer warranty and service guarantee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Secure Your Premises?</h2>
            <p>Contact us today for a free consultation and quote</p>
            <div className="cta-buttons">
              <Link href="/contact" className="btn btn-primary btn-lg">Get in Touch</Link>
              <a href={telHref} className="btn btn-secondary btn-lg">
                <i className="fas fa-phone" /> Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <section
        className="section google-reviews-section"
        style={{ background: "#f8fafc", padding: "60px 0" }}
      >
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 className="section-title">What Our Customers Say</h2>
            <p
              className="section-subtitle"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <img
                src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
                alt="Google"
                style={{ height: 20, verticalAlign: "middle" }}
              />
              &nbsp;Reviews
              <span style={{ color: "#f59e0b", fontSize: "1.2rem" }}>★★★★★</span>
            </p>
          </div>

          <div
            id="google-reviews-embed"
            style={{
              minHeight: 300,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              marginBottom: 32,
              background: "#fff",
            }}
          >
            <iframe
              src={siteConfig.googleMapsEmbed}
              width="100%"
              height={350}
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div
            style={{
              display: googleIsReal ? "grid" : "none",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: 20,
              marginBottom: 32,
            }}
          >
            {googleReviews.map((r, i) => {
              const initial = r.author_name.charAt(0).toUpperCase();
              return (
                <div
                  key={`${r.author_name}-${i}`}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 22,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                    border: "1px solid #e8f4fd",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    {r.profile_photo_url ? (
                      <img
                        src={r.profile_photo_url}
                        alt={r.author_name}
                        style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #1a365d, #0ea5e9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#1a365d", fontSize: "0.9rem" }}>
                        {r.author_name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {r.relative_time_description}
                      </div>
                    </div>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/24px-Google_%22G%22_logo.svg.png"
                      alt="Google"
                      style={{ width: 20, height: 20 }}
                    />
                  </div>
                  <div style={{ color: "#f59e0b", fontSize: "1rem", marginBottom: 8, letterSpacing: 1 }}>
                    {"★".repeat(r.rating)}
                  </div>
                  <p style={{ color: "#555", fontSize: "0.88rem", lineHeight: 1.65, margin: 0 }}>
                    {r.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center" }}>
            <a
              href="https://www.google.com/maps/place/Syncbyte+Innovations+Private+Limited/@12.9419281,77.5644271,18z/data=!4m8!3m7!1s0x3bae156a3bb7a3f1:0x45c9878ce517b865!8m2!3d12.9419281!4d77.5644271!9m1!1b1"
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                border: "2px solid #1a365d",
                color: "#1a365d",
                padding: "12px 30px",
                borderRadius: 50,
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/24px-Google_%22G%22_logo.svg.png"
                alt=""
                style={{ width: 18 }}
              />
              Write a Google Review
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
