import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loadBrandLogos, resolveBrandLogo } from "@/lib/data/brand-logos-server";
import { loadEffectiveBrands } from "@/lib/data/brands-effective";
import { AdminTopBar } from "@/components/AdminTopBar";
import { BrandsAdminClient } from "@/components/BrandsAdminClient";

export const metadata = { title: "Admin · Brands" };
export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const [logos, brands] = await Promise.all([
    loadBrandLogos(),
    loadEffectiveBrands(),
  ]);
  const view = brands.map((b) => ({
    slug: b.slug,
    name: b.name,
    logo_url: resolveBrandLogo(b.slug, logos),
    uploaded: logos.has(b.slug),
    isCustom: b.isCustom,
  }));

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Brands" username={session.username} activeTab="brands" />
      <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
        <BrandsAdminClient brands={view} />
      </div>
    </div>
  );
}
