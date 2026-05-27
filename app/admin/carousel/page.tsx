import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { productCategories } from "@/lib/data/products";
import { loadCarouselSlides } from "@/lib/data/home-server";
import { AdminTopBar } from "@/components/AdminTopBar";
import { CarouselAdminClient } from "@/components/CarouselAdminClient";

export const metadata = { title: "Admin · Carousel" };
export const dynamic = "force-dynamic";

export default async function AdminCarouselPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const slides = await loadCarouselSlides();
  const categories = Object.entries(productCategories).map(([slug, cat]) => ({
    slug,
    name: cat.name,
  }));

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Hero Carousel" username={session.username} activeTab="carousel" />
      <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto" }}>
        <CarouselAdminClient slides={slides} categories={categories} />
      </div>
    </div>
  );
}
