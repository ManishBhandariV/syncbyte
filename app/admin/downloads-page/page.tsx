import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { SiteDownload } from "@/lib/db/types";
import { AdminTopBar } from "@/components/AdminTopBar";
import { SiteDownloadsAdminClient } from "@/components/SiteDownloadsAdminClient";

export const metadata = { title: "Admin · Downloads Page" };
export const dynamic = "force-dynamic";

export default async function AdminDownloadsPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const db = await getDb();
  const downloads = await db.all<SiteDownload>(
    "SELECT * FROM site_downloads ORDER BY display_order, id",
  );

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Downloads Page" username={session.username} activeTab="downloads-page" />
      <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto" }}>
        <SiteDownloadsAdminClient downloads={downloads} />
      </div>
    </div>
  );
}
