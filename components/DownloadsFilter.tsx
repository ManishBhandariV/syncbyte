"use client";

import { useState } from "react";

export type DownloadFile = {
  name: string;
  extension: string;
  filename: string;
  size: string;
  category?: string;
  description?: string;
  /** Direct URL (Blob). If set, used as the download href instead of /downloads/{filename}. */
  url?: string;
};

function fileIcon(ext: string): string {
  switch (ext.toUpperCase()) {
    case "PDF": return "fa-file-pdf";
    case "ZIP":
    case "RAR":
    case "7Z": return "fa-file-zipper";
    case "DOC":
    case "DOCX": return "fa-file-word";
    case "XLS":
    case "XLSX": return "fa-file-excel";
    case "EXE":
    case "MSI": return "fa-file-code";
    default: return "fa-file";
  }
}

function catSlug(c: string): string {
  return c.toLowerCase().replaceAll(" ", "-");
}

export function DownloadsFilter({ files }: { files: DownloadFile[] }) {
  const [active, setActive] = useState<string>("all");

  const categories = Array.from(
    new Set(files.map((f) => f.category ?? "Other")),
  );

  return (
    <>
      <div className="downloads-filter">
        <button
          className={`filter-btn ${active === "all" ? "active" : ""}`}
          onClick={() => setActive("all")}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`filter-btn ${active === catSlug(c) ? "active" : ""}`}
            onClick={() => setActive(catSlug(c))}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="downloads-grid">
        {files.map((f, i) => {
          const cat = catSlug(f.category ?? "Other");
          const visible = active === "all" || active === cat;
          return (
            <div
              key={`${f.filename}-${i}`}
              className="download-card"
              data-category={cat}
              style={{ display: visible ? "flex" : "none" }}
            >
              <div className="download-card-icon">
                <i className={`fas ${fileIcon(f.extension)}`} />
                <span className="file-type">{f.extension}</span>
              </div>
              <div className="download-card-info">
                <h3 className="download-title">{f.name}</h3>
                {f.description && <p className="download-desc">{f.description}</p>}
                <div className="download-meta">
                  <span className="file-size">
                    <i className="fas fa-database" /> {f.size}
                  </span>
                  {f.category && (
                    <span className="file-category">
                      <i className="fas fa-folder" /> {f.category}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={f.url ?? `/downloads/${encodeURIComponent(f.filename)}`}
                className="download-btn"
                target={f.url ? "_blank" : undefined}
                rel={f.url ? "noopener" : undefined}
                download
              >
                <i className="fas fa-download" />
                <span>Download</span>
              </a>
            </div>
          );
        })}
      </div>
    </>
  );
}
