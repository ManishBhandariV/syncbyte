"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config";
import { productCategories, getCategoryUrl } from "@/lib/data/products";

const POPULAR_CATEGORIES = [
  "fingerprint",
  "face",
  "boom-barrier",
  "turnstiles",
  "access-control",
  "software-solutions",
];

export function Footer() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin")) return null;

  const year = new Date().getFullYear();
  const telHref = `tel:${siteConfig.companyPhone.replace(/\s/g, "")}`;

  return (
    <footer className="main-footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            {/* About */}
            <div className="footer-column">
              <h3 className="footer-title">About Us</h3>
              <p className="footer-about">
                {siteConfig.companyName} is a leading provider of biometric,
                access control, and security solutions. We deliver innovative
                technology solutions for businesses across India.
              </p>
              <div className="footer-social">
                <a href={siteConfig.social.facebook} target="_blank" rel="noopener" title="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href={siteConfig.social.instagram} target="_blank" rel="noopener" title="Instagram">
                  <i className="fab fa-instagram" />
                </a>
                <a href={siteConfig.social.linkedin} target="_blank" rel="noopener" title="LinkedIn">
                  <i className="fab fa-linkedin-in" />
                </a>
                <a href={siteConfig.social.youtube} target="_blank" rel="noopener" title="YouTube">
                  <i className="fab fa-youtube" />
                </a>
                <a href={siteConfig.social.x} target="_blank" rel="noopener" title="X (Twitter)">
                  <i className="fab fa-x-twitter" />
                </a>
                <a href={siteConfig.social.threads} target="_blank" rel="noopener" title="Threads">
                  <i className="fab fa-threads" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h3 className="footer-title">Quick Links</h3>
              <ul className="footer-links">
                <li><Link href="/"><i className="fas fa-chevron-right" /> Home</Link></li>
                <li><Link href="/products"><i className="fas fa-chevron-right" /> Products</Link></li>
                <li><Link href="/gallery"><i className="fas fa-chevron-right" /> Gallery</Link></li>
                <li><Link href="/reviews"><i className="fas fa-chevron-right" /> Reviews</Link></li>
                <li><Link href="/downloads"><i className="fas fa-chevron-right" /> Downloads</Link></li>
                <li><Link href="/contact"><i className="fas fa-chevron-right" /> Contact Us</Link></li>
              </ul>
            </div>

            {/* Popular Categories */}
            <div className="footer-column">
              <h3 className="footer-title">Popular Categories</h3>
              <ul className="footer-links">
                {POPULAR_CATEGORIES.map((slug) => {
                  const cat = productCategories[slug];
                  if (!cat) return null;
                  return (
                    <li key={slug}>
                      <Link href={getCategoryUrl(slug)}>
                        <i className="fas fa-chevron-right" /> {cat.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-column">
              <h3 className="footer-title">Contact Info</h3>
              <ul className="footer-contact">
                <li>
                  <i className="fas fa-building" />
                  <span>{siteConfig.companyName}</span>
                </li>
                <li>
                  <i className="fas fa-map-marker-alt" />
                  <span>{siteConfig.companyAddress}</span>
                </li>
                <li>
                  <i className="fas fa-phone" />
                  <a href={telHref}>{siteConfig.companyPhone}</a>
                </li>
                <li>
                  <i className="fas fa-envelope" />
                  <a href={`mailto:${siteConfig.companyEmail}`}>
                    {siteConfig.companyEmail}
                  </a>
                </li>
                <li>
                  <i className="fas fa-map" />
                  <a href={siteConfig.googleMapsLink} target="_blank" rel="noopener">
                    View on Google Maps
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p>&copy; {year} {siteConfig.companyName}. All Rights Reserved.</p>
            <p>Designed for Security Excellence</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
