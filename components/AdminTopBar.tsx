import Link from "next/link";
import { logout } from "@/app/admin/actions";

export function AdminTopBar({
  title,
  username,
  activeTab,
  pendingReviewCount,
}: {
  title: string;
  username: string;
  activeTab:
    | "products"
    | "featured"
    | "carousel"
    | "reviews"
    | "enquiries"
    | "gallery"
    | "brands"
    | "categories"
    | "quotes"
    | "downloads-page";
  pendingReviewCount?: number;
}) {
  const tabs = [
    { id: "products",       label: "Products",  href: "/admin" },
    { id: "featured",       label: "Featured",  href: "/admin/featured" },
    { id: "carousel",       label: "Carousel",  href: "/admin/carousel" },
    { id: "gallery",        label: "Gallery",   href: "/admin/gallery" },
    { id: "brands",         label: "Brands",    href: "/admin/brands" },
    { id: "categories",     label: "Categories", href: "/admin/categories" },
    { id: "downloads-page", label: "Downloads", href: "/admin/downloads-page" },
    { id: "quotes",         label: "Quotes",    href: "/admin/quotes" },
    { id: "reviews",        label: "Reviews",   href: "/admin/reviews" },
    { id: "enquiries",      label: "Enquiries", href: "/admin/enquiries" },
  ] as const;

  return (
    <div
      style={{
        background: "#fff",
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <h1 style={{ fontSize: "1.1rem", color: "#1a365d" }}>{title}</h1>
        <nav style={{ display: "flex", gap: 14 }}>
          {tabs.map((t) => {
            const active = t.id === activeTab;
            return (
              <Link
                key={t.id}
                href={t.href}
                style={{
                  fontSize: "0.85rem",
                  color: active ? "#0ea5e9" : "#64748b",
                  textDecoration: "none",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {t.label}
                {t.id === "reviews" && pendingReviewCount != null && pendingReviewCount > 0 && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "1px 7px",
                      fontSize: "0.7rem",
                      marginLeft: 6,
                    }}
                  >
                    {pendingReviewCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div>
        <span style={{ color: "#94a3b8", fontSize: "0.82rem", marginRight: 16 }}>
          Logged in as <strong>{username}</strong>
        </span>
        <form action={logout} style={{ display: "inline" }}>
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "0.85rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </form>
      </div>
    </div>
  );
}
