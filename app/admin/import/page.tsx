import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminTopBar } from "@/components/AdminTopBar";
import { ImportClient } from "@/components/ImportClient";

export const metadata = { title: "Admin · Import Products" };
export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Bulk Import" username={session.username} activeTab="products" />
      <div style={{ padding: 28, maxWidth: 760, margin: "0 auto" }}>
        <ImportClient />
      </div>
    </div>
  );
}
