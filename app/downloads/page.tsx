import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { DownloadsFilter, type DownloadFile } from "@/components/DownloadsFilter";
import { getDb } from "@/lib/db";
import type { SiteDownload } from "@/lib/db/types";

export const metadata = { title: "Downloads" };
export const dynamic = "force-dynamic";

async function loadDbDownloads(): Promise<DownloadFile[]> {
  try {
    const db = await getDb();
    const rows = await db.all<SiteDownload>(
      "SELECT * FROM site_downloads ORDER BY display_order, id",
    );
    return rows.map((r) => ({
      name: r.title,
      extension: (r.file_type || "file").toUpperCase(),
      filename: r.title,
      size: r.file_size || "",
      category: r.category || "Other",
      description: r.description ?? undefined,
      url: r.file_url,
    }));
  } catch {
    return [];
  }
}

const SAMPLE_FILES: DownloadFile[] = [
  { name: "Attendance Software", extension: "ZIP", filename: "attendance-software.zip", size: "45 MB", category: "Software", description: "Time and Attendance Management Software" },
  { name: "ZKAccess Software", extension: "ZIP", filename: "zkaccess-software.zip", size: "120 MB", category: "Software", description: "Access Control Management Software" },
  { name: "BioTime Pro", extension: "ZIP", filename: "biotime-pro.zip", size: "85 MB", category: "Software", description: "Advanced Time Management Solution" },
  { name: "Device Driver Pack", extension: "ZIP", filename: "device-drivers.zip", size: "25 MB", category: "Drivers", description: "USB drivers for all biometric devices" },
  { name: "SDK Documentation", extension: "PDF", filename: "sdk-documentation.pdf", size: "5 MB", category: "Documentation", description: "Developer SDK integration guide" },
  { name: "User Manual - Fingerprint Devices", extension: "PDF", filename: "fingerprint-manual.pdf", size: "8 MB", category: "Documentation", description: "Installation and user guide" },
  { name: "User Manual - Face Recognition", extension: "PDF", filename: "face-recognition-manual.pdf", size: "10 MB", category: "Documentation", description: "Face recognition device manual" },
  { name: "Product Catalogue 2024", extension: "PDF", filename: "catalogue-2024.pdf", size: "15 MB", category: "Catalogue", description: "Complete product catalogue" },
  { name: "API Integration Guide", extension: "PDF", filename: "api-guide.pdf", size: "3 MB", category: "Documentation", description: "REST API documentation" },
  { name: "HRMS Software", extension: "ZIP", filename: "hrms-software.zip", size: "95 MB", category: "Software", description: "Human Resource Management System" },
];

function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(2) + " GB";
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return `${bytes} bytes`;
}

function scanDownloads(): DownloadFile[] {
  const dir = path.join(process.cwd(), "public", "downloads");
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: DownloadFile[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(dir, entry.name);
      const stat = fs.statSync(filePath);
      const dotIdx = entry.name.lastIndexOf(".");
      const ext = dotIdx >= 0 ? entry.name.slice(dotIdx + 1).toUpperCase() : "FILE";
      const base = dotIdx >= 0 ? entry.name.slice(0, dotIdx) : entry.name;
      files.push({
        name: base,
        extension: ext,
        filename: entry.name,
        size: formatSize(stat.size),
      });
    }
    return files;
  } catch {
    return [];
  }
}

export default async function DownloadsPage() {
  // Priority: admin-managed DB downloads → bundled /public/downloads scan → sample list.
  const dbFiles = await loadDbDownloads();
  const scanned = dbFiles.length > 0 ? [] : scanDownloads();
  const files = dbFiles.length > 0 ? dbFiles : scanned.length > 0 ? scanned : SAMPLE_FILES;

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">Downloads</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Downloads</span>
          </nav>
        </div>
      </section>

      <section className="section downloads-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Software & Documentation</h2>
            <p className="section-subtitle">
              Download software, drivers, manuals and documentation for our products
            </p>
          </div>
          <DownloadsFilter files={files} />
        </div>
      </section>

      <section className="section support-section bg-light">
        <div className="container">
          <div className="support-grid">
            <div className="support-card">
              <div className="support-icon"><i className="fas fa-headset" /></div>
              <h3>Need Technical Support?</h3>
              <p>
                Our technical team is available to help you with installation
                and configuration.
              </p>
              <Link href="/contact" className="btn btn-outline">
                Contact Support
              </Link>
            </div>
            <div className="support-card">
              <div className="support-icon"><i className="fas fa-book" /></div>
              <h3>Looking for Documentation?</h3>
              <p>
                Can&apos;t find what you&apos;re looking for? Contact us for
                specific product documentation.
              </p>
              <a href={`mailto:${siteConfig.companyEmail}`} className="btn btn-outline">
                Request Documentation
              </a>
            </div>
            <div className="support-card">
              <div className="support-icon"><i className="fab fa-youtube" /></div>
              <h3>Video Tutorials</h3>
              <p>
                Watch step-by-step installation and configuration videos on our
                YouTube channel.
              </p>
              <a
                href={siteConfig.social.youtube}
                target="_blank"
                rel="noopener"
                className="btn btn-outline"
              >
                Watch Videos
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
