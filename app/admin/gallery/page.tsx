import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { GalleryImage, GalleryVideo } from "@/lib/db/types";
import { AdminTopBar } from "@/components/AdminTopBar";
import { GalleryAdminClient } from "@/components/GalleryAdminClient";

export const metadata = { title: "Admin · Gallery" };
export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const db = await getDb();
  const images = await db.all<GalleryImage>(
    "SELECT * FROM gallery_images ORDER BY display_order, id DESC",
  );
  const videos = await db.all<GalleryVideo>(
    "SELECT * FROM gallery_videos ORDER BY display_order, id DESC",
  );

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar
        title="Gallery"
        username={session.username}
        activeTab="gallery"
      />
      <div style={{ padding: 28, maxWidth: 1200, margin: "0 auto" }}>
        <GalleryAdminClient images={images} videos={videos} />
      </div>
    </div>
  );
}
