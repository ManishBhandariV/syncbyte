import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { productCategories } from "@/lib/data/products";
import { AdminTopBar } from "@/components/AdminTopBar";
import { AddProductForm } from "@/components/AddProductForm";

export const metadata = { title: "Admin · Add Product" };
export const dynamic = "force-dynamic";

export default async function AddProductPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const categories = Object.entries(productCategories).map(([slug, cat]) => ({
    slug,
    name: cat.name,
  }));

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar
        title="Add a new product"
        username={session.username}
        activeTab="products"
      />
      <div style={{ padding: 28, maxWidth: 720, margin: "0 auto" }}>
        <AddProductForm categories={categories} />
      </div>
    </div>
  );
}
