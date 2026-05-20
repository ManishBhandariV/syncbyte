import Link from "next/link";
import { loadBrandLogos, resolveBrandLogo } from "@/lib/data/brand-logos-server";
import { loadEffectiveBrands } from "@/lib/data/brands-effective";

export async function BrandsSection() {
  const [dbLogos, brands] = await Promise.all([
    loadBrandLogos(),
    loadEffectiveBrands(),
  ]);

  return (
    <section className="section brands-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Brands We Offer</h2>
          <p className="section-subtitle">
            Click any brand to see all products from that manufacturer
          </p>
        </div>
        <div className="brands-grid">
          {brands.map((brand) => {
            const logo = resolveBrandLogo(brand.slug, dbLogos);
            return (
              <Link
                key={brand.slug}
                href={`/products?brand=${encodeURIComponent(brand.slug)}`}
                className="brand-card"
                title={`See all ${brand.name} products`}
              >
                {logo ? (
                  <img src={logo} alt={`${brand.name} logo`} />
                ) : (
                  <span className="brand-card-text">{brand.name}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
