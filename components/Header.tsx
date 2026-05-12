"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config";
import { productCategories, getCategoryUrl } from "@/lib/data/products";

function isActive(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function Header() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin")) return null;

  const categoryEntries = Object.entries(productCategories);
  const columnsCount = 4;
  const itemsPerColumn = Math.ceil(categoryEntries.length / columnsCount);
  const columns: typeof categoryEntries[] = [];
  for (let i = 0; i < categoryEntries.length; i += itemsPerColumn) {
    columns.push(categoryEntries.slice(i, i + itemsPerColumn));
  }

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="top-bar-left">
              <span>
                <i className="fas fa-envelope" /> {siteConfig.companyEmail}
              </span>
              <span>
                <i className="fas fa-phone" /> {siteConfig.companyPhone}
              </span>
            </div>
            <div className="top-bar-right">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="main-header">
        <div className="container">
          <div className="header-content">
            <Link href="/" className="logo">
              <img
                src="/images/logo.png"
                alt={siteConfig.companyName}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = "block";
                }}
              />
              <span className="logo-text" style={{ display: "none" }}>
                {siteConfig.companyName}
              </span>
            </Link>

            {/* Search Bar */}
            <div className="search-bar">
              <form action="/search" method="GET" className="search-form">
                <input
                  type="text"
                  name="q"
                  placeholder="Search products..."
                  className="search-input"
                  autoComplete="off"
                  id="searchInput"
                />
                <button type="submit" className="search-btn">
                  <i className="fas fa-search" />
                </button>
              </form>
              <div className="search-results" id="searchResults" />
            </div>

            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle menu">
              <i className="fas fa-bars" />
            </button>

            {/* Navigation */}
            <nav className="main-nav" id="mainNav">
              <ul className="nav-list">
                <li className={`nav-item ${isActive(pathname, "/") ? "active" : ""}`}>
                  <Link href="/">Home</Link>
                </li>
                <li className={`nav-item has-dropdown ${isActive(pathname, "/products") ? "active" : ""}`}>
                  <Link href="/products">
                    Products <i className="fas fa-chevron-down" />
                  </Link>
                  <div className="mega-dropdown">
                    <div className="mega-dropdown-content">
                      {columns.map((col, ci) => (
                        <div className="mega-column" key={ci}>
                          {col.map(([slug, category]) => (
                            <Link
                              key={slug}
                              href={getCategoryUrl(slug)}
                              className="mega-item"
                            >
                              <i className={`fas ${category.icon}`} />
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
                <li className={`nav-item ${isActive(pathname, "/gallery") ? "active" : ""}`}>
                  <Link href="/gallery">Gallery</Link>
                </li>
                <li className={`nav-item ${isActive(pathname, "/reviews") ? "active" : ""}`}>
                  <Link href="/reviews">Reviews</Link>
                </li>
                <li className={`nav-item ${isActive(pathname, "/downloads") ? "active" : ""}`}>
                  <Link href="/downloads">Downloads</Link>
                </li>
                <li className={`nav-item ${isActive(pathname, "/contact") ? "active" : ""}`}>
                  <Link href="/contact">Contact Us</Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
